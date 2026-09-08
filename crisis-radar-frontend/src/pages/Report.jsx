import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const BLR = [12.9716, 77.5946];

const SEVERITIES = [
  'critical',
  'high',
  'moderate',
  'low',
];

/* =========================================================
   MAP CONTROLLER
   Moves the map when device location is selected
   ========================================================= */

function MapController({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(
        [position.lat, position.lng],
        16
      );
    }
  }, [position, map]);

  return null;
}

/* =========================================================
   LOCATION PICKER
   Allows clicking + dragging the marker
   ========================================================= */

function LocationPicker({
  position,
  onPositionChange,
}) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    },
  });

  if (!position) {
    return null;
  }

  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          onPositionChange(marker.getLatLng());
        },
      }}
    />
  );
}

/* =========================================================
   REPORT PAGE
   ========================================================= */

export default function Report() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [type, setType] = useState('flood');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('');

  const [position, setPosition] = useState(null);
  const [area, setArea] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  /* =======================================================
     CLEAN UP IMAGE PREVIEW
     ======================================================= */

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  /* =======================================================
     REVERSE GEOCODING
     Converts coordinates -> readable area
     ======================================================= */

  const findAreaFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      const address = data.address || {};

      const readableArea =
        address.suburb ||
        address.neighbourhood ||
        address.quarter ||
        address.city_district ||
        address.town ||
        address.city ||
        address.village ||
        '';

      if (readableArea) {
        setArea(readableArea);
      }
    } catch (err) {
      console.error(
        'Could not determine area from coordinates:',
        err
      );
    }
  };

  /* =======================================================
     MAP LOCATION CHANGE
     ======================================================= */

  const handlePositionChange = (newPosition) => {
    const normalizedPosition = {
      lat: newPosition.lat,
      lng: newPosition.lng,
    };

    setPosition(normalizedPosition);

    findAreaFromCoordinates(
      normalizedPosition.lat,
      normalizedPosition.lng
    );
  };

  /* =======================================================
     USE DEVICE LOCATION
     ======================================================= */

  const useCurrentLocation = () => {
    setError(null);

    if (!navigator.geolocation) {
      setError(
        'Location services are not supported by this browser.'
      );
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (result) => {
        const newPosition = {
          lat: result.coords.latitude,
          lng: result.coords.longitude,
        };

        setPosition(newPosition);

        findAreaFromCoordinates(
          newPosition.lat,
          newPosition.lng
        );

        setGettingLocation(false);
      },

      (locationError) => {
        setGettingLocation(false);

        if (locationError.code === 1) {
          setError(
            'Location permission was denied. Allow location access or select the location manually on the map.'
          );
        } else if (locationError.code === 2) {
          setError(
            'Your current location could not be determined.'
          );
        } else if (locationError.code === 3) {
          setError(
            'Location request timed out. Please try again.'
          );
        } else {
          setError(
            'Could not access your current location.'
          );
        }
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  /* =======================================================
     IMAGE SELECTION
     ======================================================= */

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        'Please select a JPG, PNG or WebP image.'
      );

      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        'The image must be smaller than 5 MB.'
      );

      e.target.value = '';
      return;
    }

    setError(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(null);
    setImagePreview(null);
  };

  /* =======================================================
     SUBMIT REPORT
     ======================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError(null);
    setSuccess(false);

    if (!title.trim() || !description.trim()) {
      setError(
        'Please add a title and description.'
      );
      return;
    }

    if (!position) {
      setError(
        'Please pin the location on the map or use your current location.'
      );
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append('type', type);

      formData.append(
        'title',
        title.trim()
      );

      formData.append(
        'description',
        description.trim()
      );

      formData.append(
        'latitude',
        String(position.lat)
      );

      formData.append(
        'longitude',
        String(position.lng)
      );

      formData.append(
        'area',
        area.trim()
      );

      formData.append(
        'severity',
        severity || 'moderate'
      );

      if (image) {
        formData.append(
          'evidence',
          image
        );
      }

      /*
        Do NOT manually set Content-Type here.

        Axios/browser will automatically set:
        multipart/form-data; boundary=...
      */

      await api.post(
        '/reports',
        formData
      );

      setSuccess(true);

      setType('flood');
      setTitle('');
      setDescription('');
      setSeverity('');
      setPosition(null);
      setArea('');

      removeImage();

      setTimeout(() => {
        setSuccess(false);
      }, 4500);
    } catch (err) {
      console.error(
        'Report submission error:',
        err
      );

      setError(
        err.response?.data?.error ||
          'Something went wrong submitting your report.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     LOGIN REQUIRED
     ======================================================= */

  if (!user) {
    return (
      <div className="centered-msg">
        <p>
          You need to be logged in to submit a report.
        </p>

        <button
          className="btn btn-primary"
          onClick={() => navigate('/login')}
        >
          Log in
        </button>
      </div>
    );
  }

  /* =======================================================
     PAGE
     ======================================================= */

  return (
    <div className="wrap reportgrid">
      {/* ================= LEFT SIDE ================= */}

      <div>
        <h2
          style={{
            fontSize: 32,
            marginBottom: 8,
          }}
        >
          Report a crisis
        </h2>

        <p
          style={{
            color: 'var(--muted)',
            fontSize: 14.5,
            marginBottom: 22,
          }}
        >
          Give enough detail for someone else to
          understand the situation at a glance. Reports
          are checked by a local authority before they're
          marked verified.
        </p>

        {success && (
          <div className="success-banner">
            Report submitted successfully.
          </div>
        )}

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <form
          className="form-card"
          onSubmit={handleSubmit}
        >
          {/* CRISIS TYPE */}

          <div className="field">
            <label>Crisis type</label>

            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value)
              }
            >
              <option value="flood">
                Flood / waterlogging
              </option>

              <option value="roadblock">
                Roadblock / accident
              </option>

              <option value="power">
                Power outage
              </option>

              <option value="fire">
                Fire
              </option>

              <option value="medical">
                Medical emergency
              </option>

              <option value="infrastructure">
                Infrastructure damage
              </option>
              <option value="others">
                Others
              </option>

            </select>
          </div>

          {/* TITLE */}

          <div className="field">
            <label>Title</label>

            <input
              type="text"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Short summary, e.g. Waterlogging blocking main road"
              required
            />
          </div>

          {/* DESCRIPTION */}

          <div className="field">
            <label>Description</label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="What's happening, how bad is it, anything responders should know…"
              required
            />
          </div>

          {/* SEVERITY */}

          <div className="field">
            <label>Severity</label>

            <div className="sev-picker">
              {SEVERITIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`sev-btn ${
                    severity === s
                      ? `sel-${s}`
                      : ''
                  }`}
                  onClick={() =>
                    setSeverity(s)
                  }
                >
                  {s[0].toUpperCase() +
                    s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* LOCATION */}

          <div className="field">
            <label>Location / Area</label>

            <input
              type="text"
              value={area}
              onChange={(e) =>
                setArea(e.target.value)
              }
              placeholder="Area will appear after selecting a location"
            />

            <button
              type="button"
              className="btn btn-ghost"
              onClick={useCurrentLocation}
              disabled={gettingLocation}
              style={{
                width: '100%',
                justifyContent: 'center',
                marginTop: 8,
              }}
            >
              {gettingLocation
                ? 'Getting your location…'
                : '📍 Use my current location'}
            </button>
          </div>

          {/* PHOTO */}

          <div className="field">
            <label>
              Photo evidence (optional)
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
            />

            <p
              style={{
                fontSize: 12,
                color: 'var(--muted)',
                marginTop: 6,
              }}
            >
              JPG, PNG or WebP — maximum 5 MB.
            </p>

            {imagePreview && (
              <div
                style={{
                  marginTop: 12,
                }}
              >
                <img
                  src={imagePreview}
                  alt="Selected evidence"
                  style={{
                    width: '100%',
                    maxHeight: 250,
                    objectFit: 'cover',
                    borderRadius: 6,
                  }}
                />

                <div
                  style={{
                    fontSize: 12.5,
                    color: 'var(--muted)',
                    marginTop: 6,
                  }}
                >
                  {image?.name}
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={removeImage}
                  style={{
                    marginTop: 8,
                  }}
                >
                  Remove photo
                </button>
              </div>
            )}
          </div>

          {/* SUBMIT */}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              justifyContent: 'center',
            }}
          >
            {submitting
              ? 'Submitting…'
              : 'Submit report'}
          </button>
        </form>
      </div>

      {/* ================= RIGHT SIDE / MAP ================= */}

      <div>
        <label
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Pin the location
        </label>

        <div className="report-map-box">
          <MapContainer
            center={BLR}
            zoom={11.5}
            style={{
              height: '100%',
              width: '100%',
            }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController
              position={position}
            />

            <LocationPicker
              position={position}
              onPositionChange={
                handlePositionChange
              }
            />
          </MapContainer>
        </div>

        <p
          style={{
            fontSize: 12.5,
            color: 'var(--muted)',
            marginTop: 8,
          }}
        >
          Click anywhere on the map to drop a pin, drag
          the marker to adjust it, or use your device
          location.
        </p>

        <p
          style={{
            fontSize: 12.5,
            color: 'var(--muted)',
            marginTop: 4,
          }}
        >
          Selected:{' '}
          <span className="mono">
            {position
              ? `${position.lat.toFixed(
                  5
                )}, ${position.lng.toFixed(5)}`
              : 'none yet'}
          </span>
        </p>

        {area && (
          <p
            style={{
              fontSize: 12.5,
              color: 'var(--muted)',
              marginTop: 4,
            }}
          >
            Area: <strong>{area}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
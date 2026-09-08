const pool = require('../config/db');
const { asyncHandler } = require('../middleware/errorHandler');

const REPORT_SELECT = `
  SELECT r.id, r.type, r.title, r.description, r.latitude, r.longitude, r.area,
         r.severity, r.status, r.evidence_url, r.created_at, r.updated_at,
         r.reporter_id, ru.name AS reporter_name,
         r.verified_by_id, vu.name AS verified_by_name
  FROM reports r
  LEFT JOIN users ru ON ru.id = r.reporter_id
  LEFT JOIN users vu ON vu.id = r.verified_by_id
`;

/* =========================================================
   GET ALL REPORTS
   ========================================================= */

const listReports = asyncHandler(async (req, res) => {
  const { type, severity, status, q } = req.query;

  const conditions = [];
  const values = [];

  if (type) {
    values.push(type);
    conditions.push(`r.type = $${values.length}`);
  }

  if (severity) {
    values.push(severity);
    conditions.push(`r.severity = $${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`r.status = $${values.length}`);
  }

  if (q) {
    values.push(`%${q}%`);

    conditions.push(
      `(r.title ILIKE $${values.length} OR r.area ILIKE $${values.length})`
    );
  }

  const where = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const result = await pool.query(
    `${REPORT_SELECT}
     ${where}
     ORDER BY r.created_at DESC
     LIMIT 200`,
    values
  );

  res.json({
    reports: result.rows,
  });
});

/* =========================================================
   GET MY REPORTS
   ========================================================= */

const listMyReports = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `${REPORT_SELECT}
     WHERE r.reporter_id = $1
     ORDER BY r.created_at DESC`,
    [req.user.id]
  );

  res.json({
    reports: result.rows,
  });
});

/* =========================================================
   GET SINGLE REPORT
   ========================================================= */

const getReport = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `${REPORT_SELECT}
     WHERE r.id = $1`,
    [req.params.id]
  );

  if (!result.rows[0]) {
    return res.status(404).json({
      error: 'Report not found.',
    });
  }

  res.json({
    report: result.rows[0],
  });
});

/* =========================================================
   CREATE REPORT
   ========================================================= */

const VALID_TYPES = [
  'flood',
  'roadblock',
  'power',
  'fire',
  'medical',
  'infrastructure',
];

const VALID_SEVERITIES = [
  'critical',
  'high',
  'moderate',
  'low',
];

const createReport = asyncHandler(async (req, res) => {
  const {
    type,
    title,
    description,
    latitude,
    longitude,
    area,
    severity,
  } = req.body;

  if (
    !type ||
    !title ||
    !description ||
    latitude == null ||
    longitude == null
  ) {
    return res.status(400).json({
      error:
        'type, title, description, latitude and longitude are required.',
    });
  }

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({
      error: `type must be one of: ${VALID_TYPES.join(', ')}`,
    });
  }

  if (
    severity &&
    !VALID_SEVERITIES.includes(severity)
  ) {
    return res.status(400).json({
      error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}`,
    });
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (
    !Number.isFinite(parsedLatitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    !Number.isFinite(parsedLongitude) ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return res.status(400).json({
      error: 'Invalid latitude or longitude.',
    });
  }

  /*
    Multer saves the image to:
    backend/uploads/reports/

    PostgreSQL only stores its public path.
  */

  const evidenceUrl = req.file
    ? `/uploads/reports/${req.file.filename}`
    : null;

  /*
    Authority/admin-created reports are currently
    automatically verified, preserving your existing logic.
  */

  const isVerifier =
    req.user.role === 'authority' ||
    req.user.role === 'admin';

  const status = isVerifier
    ? 'verified'
    : 'reported';

  const verifiedById = isVerifier
    ? req.user.id
    : null;

  const result = await pool.query(
    `INSERT INTO reports (
       type,
       title,
       description,
       latitude,
       longitude,
       area,
       severity,
       evidence_url,
       reporter_id,
       status,
       verified_by_id
     )
     VALUES (
       $1::crisis_type,
       $2,
       $3,
       $4,
       $5,
       $6,
       COALESCE($7::severity_level, 'moderate'),
       $8,
       $9,
       $10::report_status,
       $11
     )
     RETURNING *`,
    [
      type,
      title.trim(),
      description.trim(),
      parsedLatitude,
      parsedLongitude,
      area?.trim() || null,
      severity || null,
      evidenceUrl,
      req.user.id,
      status,
      verifiedById,
    ]
  );

  res.status(201).json({
    report: result.rows[0],
  });
});

/* =========================================================
   UPDATE REPORT STATUS
   ========================================================= */

const VALID_STATUSES = [
  'reported',
  'verified',
  'progress',
  'resolved',
];

const updateReportStatus = asyncHandler(
  async (req, res) => {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const setVerifier =
      status === 'verified'
        ? ', verified_by_id = $2'
        : '';

    const values =
      status === 'verified'
        ? [status, req.user.id, req.params.id]
        : [status, req.params.id];

    const idParamIndex =
      status === 'verified' ? 3 : 2;

    const result = await pool.query(
      `UPDATE reports
       SET status = $1${setVerifier}
       WHERE id = $${idParamIndex}
       RETURNING *`,
      values
    );

    if (!result.rows[0]) {
      return res.status(404).json({
        error: 'Report not found.',
      });
    }

    res.json({
      report: result.rows[0],
    });
  }
);

/* =========================================================
   DELETE REPORT
   ========================================================= */

const deleteReport = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `DELETE FROM reports
     WHERE id = $1
     RETURNING id`,
    [req.params.id]
  );

  if (!result.rows[0]) {
    return res.status(404).json({
      error: 'Report not found.',
    });
  }

  res.status(204).send();
});

/* =========================================================
   STATS
   ========================================================= */

const getStats = asyncHandler(async (req, res) => {
  const totals = await pool.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE status != 'resolved'
      ) AS active,

      COUNT(*) FILTER (
        WHERE status = 'resolved'
        AND updated_at > now() - interval '7 days'
      ) AS resolved_this_week,

      COUNT(DISTINCT area) AS localities
    FROM reports
  `);

  const byType = await pool.query(
    `SELECT type, COUNT(*)
     FROM reports
     GROUP BY type`
  );

  const bySeverity = await pool.query(
    `SELECT severity, COUNT(*)
     FROM reports
     GROUP BY severity`
  );

  const trend = await pool.query(`
    SELECT
      date_trunc('day', created_at) AS day,
      COUNT(*)
    FROM reports
    WHERE created_at > now() - interval '14 days'
    GROUP BY day
    ORDER BY day
  `);

  res.json({
    totals: totals.rows[0],
    byType: byType.rows,
    bySeverity: bySeverity.rows,
    trend: trend.rows,
  });
});

module.exports = {
  listReports,
  listMyReports,
  getReport,
  createReport,
  updateReportStatus,
  deleteReport,
  getStats,
};
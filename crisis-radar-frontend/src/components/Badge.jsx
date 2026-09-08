export default function Badge({ text, className }) {
  return (
    <span className={`badge ${className}`}>
      <span className="dot"></span>{text}
    </span>
  );
}

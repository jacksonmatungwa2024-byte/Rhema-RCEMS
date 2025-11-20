import "./FailedPage.css";

export default function FailedPage() {
  return (
    <div className="failed-page">
      <h1>❌ Access Denied</h1>
      <p>
        Umekataliwa kuingia moja kwa moja bila kufuata utaratibu wa homepage.
      </p>
      <a href="/" className="back-link">
        ⬅️ Rudi kwenye Homepage
      </a>
    </div>
  );
}

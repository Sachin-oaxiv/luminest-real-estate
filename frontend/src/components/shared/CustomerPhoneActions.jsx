import { getTelephoneHref, maskPhoneNumber } from "../../utils/phonePrivacy.js";
import "../../styles/components/customer-phone-actions.css";

export default function CustomerPhoneActions({ phone, showCall = true }) {
  const href = getTelephoneHref(phone);

  const preventPhoneCopy = (event) => {
    event.preventDefault();
  };

  return (
    <span
      className="lm-customer-phone-actions"
      onCopy={preventPhoneCopy}
      onContextMenu={preventPhoneCopy}
      aria-label="Customer phone number masked"
    >
      <span className="lm-customer-phone-masked">{maskPhoneNumber(phone)}</span>
      {showCall && href && (
        <a
          className="lm-customer-phone-call"
          href={href}
          aria-label="Call customer"
          onCopy={preventPhoneCopy}
          onContextMenu={preventPhoneCopy}
        >
          <span aria-hidden="true">☎</span> Call Customer
        </a>
      )}
    </span>
  );
}

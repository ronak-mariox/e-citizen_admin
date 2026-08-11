import { FEE_FIELDS, GST_RATES, feeTotals } from '../../constants/serviceForm.js';
import { rupees } from '../../utils/format.js';

/* What the citizen pays to apply.

   Three amounts, because they go to three different places: the government fee
   is the department's, the service charge is the platform's, and the delivery
   charge only exists when something has to be posted. The schema keeps them
   apart for the same reason — a refund, a settlement and a GST return each need
   a different one of them.

   The breakdown underneath is the `totalFee` virtual computed in the browser,
   so the number an admin is agreeing to is on screen before they save rather
   than on the list afterwards. */

export function ServiceFees({ fees, onChange }) {
  const set = (name, value) => onChange({ ...fees, [name]: value });

  const totals = feeTotals(fees);
  const money = (paise) => rupees(paise / 100);

  return (
    <section className="form__group">
      <h2 className="form__group-title">Fees</h2>
      <p className="form__group-hint">
        Amounts in rupees. Leave them at zero for a free service — the citizen sees “Free” rather
        than “₹0”.
      </p>

      <div className="form__grid">
        {FEE_FIELDS.map((fee) => (
          <label className="field2" key={fee.key}>
            <span className="field2__label">{fee.label} (₹)</span>
            <input
              className="field2__input"
              type="number"
              value={fees[fee.key]}
              min={0}
              step="0.01"
              onChange={(event) => set(fee.key, event.target.value)}
            />
            <span className="field2__hint">{fee.hint}</span>
          </label>
        ))}

        <label className="field2">
          <span className="field2__label">GST on the service charge</span>
          <select
            className="field2__input"
            value={fees.gstBasisPoints}
            onChange={(event) => set('gstBasisPoints', event.target.value)}
          >
            {GST_RATES.map((rate) => (
              <option value={rate.value} key={rate.value}>
                {rate.label}
              </option>
            ))}
          </select>
          <span className="field2__hint">
            Charged on the platform&apos;s charge only — a statutory fee is not a taxable supply.
          </span>
        </label>

        <label className="field2 field-card__check field2--full">
          <input
            type="checkbox"
            checked={fees.isGovtFeePaidByCitizen}
            onChange={(event) => set('isGovtFeePaidByCitizen', event.target.checked)}
          />
          <span>
            Collect the government fee from the citizen. Turn this off when the platform settles it
            with the department instead — it then stays out of what the citizen is billed.
          </span>
        </label>
      </div>

      <div className="fee-summary">
        <div className="fee-summary__row">
          <span>Government fee</span>
          <span className={fees.isGovtFeePaidByCitizen ? undefined : 'fee-summary__struck'}>
            {money(totals.govtFee)}
          </span>
        </div>
        <div className="fee-summary__row">
          <span>Service charge</span>
          <span>{money(totals.serviceCharge)}</span>
        </div>
        <div className="fee-summary__row">
          <span>GST</span>
          <span>{money(totals.gst)}</span>
        </div>
        <div className="fee-summary__row">
          <span>Delivery</span>
          <span>{money(totals.deliveryCharge)}</span>
        </div>

        <div className="fee-summary__row fee-summary__row--total">
          <span>The citizen pays</span>
          <span>{totals.total === 0 ? 'Free' : money(totals.total)}</span>
        </div>
      </div>
    </section>
  );
}

export default ServiceFees;

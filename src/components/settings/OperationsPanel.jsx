import { Link } from 'react-router-dom';

import Icon from '../dashboard/Icon.jsx';
import PanelCard from './PanelCard.jsx';

/* What an admin can do to one person at a time.

   Most rows open the list screen rather than acting here: the record, its
   history and the row it belongs to are already there, and a second place to
   edit someone is a second place for the two to disagree.

   A row with an `action` is the exception — it does the work in this panel,
   because what it needs is a person and a decision rather than a whole record.
   Both shapes render identically; only the element differs, so the list reads
   as one list. */

function OperationRow({ operation, onAction }) {
  const body = (
    <>
      <span className="op__icon">
        <Icon name={operation.icon} size={15} />
      </span>
      <span className="op__body">
        <span className="op__label">{operation.label}</span>
        <span className="op__hint">{operation.hint}</span>
      </span>
      <Icon name="chevronRight" size={14} />
    </>
  );

  if (operation.action) {
    return (
      <button className="op op--button" type="button" onClick={() => onAction(operation.action)}>
        {body}
      </button>
    );
  }

  return (
    <Link className="op" to={operation.to}>
      {body}
    </Link>
  );
}

export function OperationsPanel({ title, subtitle, operations, linkTo, linkLabel, onAction }) {
  return (
    <PanelCard
      title={title}
      subtitle={subtitle}
      action={
        <Link className="btn" to={linkTo}>
          {linkLabel}
          <Icon name="chevronRight" size={13} />
        </Link>
      }
    >
      <ul className="op-list">
        {operations.map((operation) => (
          <li key={operation.label}>
            <OperationRow operation={operation} onAction={onAction} />
          </li>
        ))}
      </ul>
    </PanelCard>
  );
}

export default OperationsPanel;

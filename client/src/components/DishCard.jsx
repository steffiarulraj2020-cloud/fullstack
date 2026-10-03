import Icon from './Icons';
import { DAYS } from '../hooks';

const short = (d) => DAYS[d].slice(0, 3);
export const availability = (m) => (!m.weekdays?.length ? 'Every day' : m.weekdays.length === 1 ? `Available on ${DAYS[m.weekdays[0]]}`
  : `Available ${[...m.weekdays].sort().map(short).join(', ')}`);

export default function DishCard({ m, onOrder, badge, note }) {
  return (
    <article className="dish">
      <div className="dish-img">
        {m.image ? <img src={m.image} alt={m.name} loading="lazy" width="400" height="260" /> : <div className="noimg"><Icon name="leaf" size={44} /></div>}
        <span className={m.veg ? 'pill-veg' : 'pill-veg nv'}><Icon name="leaf" size={12} />{m.veg ? 'VEG' : 'NON-VEG'}</span>
        {m.special && <span className="pill-special"><Icon name="flame" size={12} />SPECIAL</span>}
      </div>
      <div className="dbody">
        <div className="dtitle"><h3>{m.name}</h3><strong className="price">₹{m.price}</strong></div>
        {m.nutrition && <p className="nut">{m.nutrition}</p>}
        <p className={`avail ${badge ? 'today' : ''}`}><Icon name="calendar" size={13} />{badge || availability(m)}</p>
        {m.description && <p className="desc">{m.description}</p>}
        {!!m.tags?.length && <div className="tags">{m.tags.map((t) => <span key={t}>{t}</span>)}</div>}
        <div className="dfoot"><small className="muted">Delivery included</small>
          {onOrder ? <button className="btn wa" onClick={() => onOrder(m._id)}>Order for tomorrow</button>
            : note && <small className="muted">{note}</small>}</div>
      </div>
    </article>);
}

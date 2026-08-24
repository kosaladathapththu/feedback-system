export default function Brand({ light = false }) {
  return <div className={`brand ${light ? 'brand-light' : ''}`}><img className="brand-logo" src="/images/supun-group-of-companies-logo.png" alt="Supun Group of Companies"/><span className="brand-copy"><strong>Supun Arcade</strong><small>Guest Experience</small></span></div>;
}

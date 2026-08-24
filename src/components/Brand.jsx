import { Leaf } from 'lucide-react';
export default function Brand({ light = false }) {
  return <div className={`brand ${light ? 'brand-light' : ''}`}><span className="emblem"><Leaf size={20}/></span><span><strong>Supun Arcade</strong><small>Guest Experience</small></span></div>;
}

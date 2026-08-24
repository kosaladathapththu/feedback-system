import { useEffect, useState } from 'react'; import { onAuthStateChanged } from 'firebase/auth'; import { auth } from '../firebase/config';
export default function useAuth(){const [user,setUser]=useState(auth ? undefined : null);useEffect(()=>{if(!auth)return undefined;return onAuthStateChanged(auth,setUser);},[]);return user;}

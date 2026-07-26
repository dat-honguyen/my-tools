import { initFederation } from '@angular-architects/native-federation';

initFederation({ 'coming-soon': './remoteEntry.json' })
  .catch((err) => console.error(err))
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));

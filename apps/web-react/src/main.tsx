import ReactDOM from 'react-dom/client';

import App from './App';

import {
  ToastHost,
} from './features/shared/ToastHost';

import './styles.css';

ReactDOM.createRoot(
  document.getElementById('root')!,
).render(
  <>
    <App />
    <ToastHost />
  </>,
);

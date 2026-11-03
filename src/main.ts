import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { installAnalyticsTracker } from './features/analytics/tracker';
import './styles/global.css';
import './styles/course-theme.css';
import './styles/course-motion.css';
createApp(App).use(router).mount('#app');
// First-party analytics is enabled unless explicitly disabled for static hosting.
if (import.meta.env.VITE_ENABLE_ANALYTICS !== 'false') installAnalyticsTracker(router);

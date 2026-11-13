import '@testing-library/jest-dom/vitest';
import { MotionGlobalConfig } from 'motion/react';

// Les animations sont instantanées pendant les tests.
MotionGlobalConfig.skipAnimations = true;

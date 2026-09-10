import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { servidor } from './test/servidor'

beforeAll(() => servidor.listen())
afterEach(() => servidor.resetHandlers())
afterAll(() => servidor.close())

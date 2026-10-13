import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test.describe('original private datasets', () => {
test.beforeEach(async ({ page }) => { await page.goto('/'); await page.getByRole('button', { name: 'Buka preview lokal' }).click(); await expect(page.locator('.kpi').first()).toContainText('1,000'); });
test('navigation, filtering, pagination, record details and all three dashboards', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.getByLabel('Status', { exact: true }).selectOption('Proses Selesai');
    await expect(page.locator('.chips')).toContainText('Proses Selesai');
    await expect(page.locator('tbody tr')).toHaveCount(25);
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page.getByRole('button', { name: 'Halaman berikutnya' }).click();
    await expect(page.locator('.pagination')).toContainText('26–50');
    await page.getByRole('button', { name: 'Detail', exact: true }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('.detail-grid')).toContainText('Application Number');
    await page.getByRole('button', { name: 'Tutup detail' }).click();
    await page.getByRole('button', { name: 'Proses & Durasi', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Total Process' })).toBeVisible();
    await page.getByRole('button', { name: 'PIC & Beban Kerja', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'KPI Per Person', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Kinerja SLA', exact: true }).click();
    await expect(page.locator('.kpis')).toContainText('SLA Achievement');
    await page.getByRole('button', { name: 'Area - Non BNIdirect', exact: true }).click();
    await expect(page.locator('.kpi').first()).toContainText('1,098');
    await page.getByRole('button', { name: 'Status Implementasi', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Milestone Completion' })).toBeVisible();
    await page.getByRole('button', { name: 'Corporate - Non Piloting', exact: true }).click();
    await expect(page.locator('.kpi').first()).toContainText('4,509');
    await page.getByRole('button', { name: 'Kinerja SLA', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Official SLA Target Reference' })).toBeVisible();
    expect(errors).toEqual([]);
});
test('spreadsheet validation, apply and restore original dataset', async ({ page }) => {
    await page.getByRole('button', { name: 'Data', exact: true }).click();
    await page.locator('input[type=file]').setInputFiles({ name: 'verification.csv', mimeType: 'text/csv', buffer: Buffer.from('Application Number,Status,Request Date,Applicant Name\nTEST-1,Proses Selesai,2026-10-01,Test Company\nTEST-2,Dalam Proses,2026-10-01,Test Company\n,Done,2026-10-01,Missing ID\n') });
    await expect(page.getByRole('button', { name: 'Success (2)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Perlu Revisi (1)' })).toBeVisible();
    await page.getByRole('button', { name: 'Terapkan 2 record' }).click();
    await expect(page.locator('.records')).toContainText('2 records');
    await page.getByRole('button', { name: 'Pulihkan dataset asli' }).click();
    await page.getByRole('button', { name: 'Pulihkan sekarang' }).click();
    await expect(page.locator('.records')).toContainText('1,000 records');
});
test('CSV, Word and PowerPoint downloads are generated without runtime errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    const sourceId = (await page.locator('tbody tr').first().locator('td').first().innerText()).trim();
    await page.getByLabel('Cari data').fill(sourceId);
    await expect(page.locator('tbody tr')).toHaveCount(1);
    const csvPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'CSV', exact: true }).click();
    const csv = await csvPromise;
    expect((await readFile((await csv.path())!)).toString()).toContain(sourceId);
    await page.getByRole('button', { name: 'Report', exact: true }).click();
    await page.getByLabel('Format', { exact: true }).selectOption('docx');
    let dl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Generate Report' }).click();
    const docx = await dl;
    await docx.saveAs('private/verified-report.docx');
    expect((await readFile('private/verified-report.docx')).subarray(0, 2).toString()).toBe('PK');
    await page.getByLabel('Format', { exact: true }).selectOption('pptx');
    dl = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Generate Report' }).click();
    const pptx = await dl;
    await pptx.saveAs('private/verified-report.pptx');
    expect((await readFile('private/verified-report.pptx')).subarray(0, 2).toString()).toBe('PK');
    expect(errors).toEqual([]);
});
test('mobile dashboard fits the viewport and remains usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'private/mobile-dashboard.png', fullPage: true });
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 2);
    await page.getByRole('button', { name: 'Corporate - Non Piloting', exact: true }).click();
    await expect(page.locator('.kpi').first()).toContainText('4,509');
});

});

// Small, explicit test fixtures: never bundled or presented as actual business data.
test.describe('Dashboard 4 navigation without private datasets', () => {
    test.beforeEach(async ({ page }) => {
        await page.route('**/__local-data/*', route => route.fulfill({
            json: [{ 'Application Number': 'TEST-IJR', 'Applicant Name': 'Test fixture',
                'Request Date': '2026-10-01', Status: 'Dalam Proses',
                id: 'TEST-OTHER', company: 'Test fixture', status: 'In progress' }],
        }));
        await page.goto('/');
        await page.getByRole('button', { name: 'Buka preview lokal' }).click();
        await expect(page.locator('.kpi').first()).toBeVisible();
    });

    test('four menus share one app; placeholder has no data requests or business controls', async ({ page }) => {
        const errors: string[] = [], requests: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('request', request => {
            if (/__local-data|\/rest\/v1\//.test(request.url())) requests.push(request.url());
        });
        const url = page.url();
        const nav = page.getByRole('navigation', { name: 'Pilih dashboard' });
        await expect(nav.getByRole('button')).toHaveCount(4);
        for (const title of ['IJR - BNIdirect', 'Area - Non BNIdirect', 'Corporate - Non Piloting']) {
            await nav.getByRole('button', { name: title, exact: true }).click();
            await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
            await expect(page.locator('.kpi').first()).toBeVisible();
            requests.length = 0;
            await nav.getByRole('button', { name: 'Dashboard 4', exact: true }).click();
            await expect(page.getByRole('heading', { name: 'Dashboard 4', exact: true })).toBeVisible();
            await expect(nav.getByRole('button', { name: 'Dashboard 4', exact: true })).toHaveAttribute('aria-current', 'page');
            await expect(page.locator('.dashboard-placeholder')).toContainText('Dataset dan indikator bisnis untuk Dashboard 4 belum ditetapkan');
            await expect(page.locator('.kpi, .filter-panel, .tabs, .records, table')).toHaveCount(0);
            await expect(page.getByRole('button', { name: 'Refresh data' })).toHaveCount(0);
            await expect(page.locator('.page-footer')).not.toContainText(/records|Memo SLA/);
            await expect(page.getByRole('alert')).toHaveCount(0);
            expect(page.url()).toBe(url);
            expect(requests).toEqual([]);
        }
        await page.getByRole('button', { name: 'Kembali ke IJR - BNIdirect', exact: true }).click();
        await expect(page.locator('.kpi').first()).toBeVisible();
        expect(errors).toEqual([]);
    });

    test('placeholder stays visible when an earlier dataset request finishes late', async ({ page }) => {
        let release!: () => void;
        const pending = new Promise<void>(resolve => { release = resolve; });
        let started!: () => void;
        const requested = new Promise<void>(resolve => { started = resolve; });
        await page.route('**/__local-data/corporate', async route => {
            started();
            await pending;
            await route.fulfill({ json: [] });
        });
        await page.getByRole('button', { name: 'Corporate - Non Piloting', exact: true }).click();
        await requested;
        await page.getByRole('button', { name: 'Dashboard 4', exact: true }).click();
        await expect(page.locator('.dashboard-placeholder')).toBeVisible();
        const response = page.waitForResponse('**/__local-data/corporate');
        release();
        await (await response).finished();
        await expect(page.locator('.dashboard-placeholder')).toBeVisible();
        await expect(page.locator('.kpi')).toHaveCount(0);
        await expect(page.getByRole('alert')).toHaveCount(0);
    });

    test('placeholder clears prior data errors and fits mobile navigation', async ({ page }) => {
        await page.route('**/__local-data/regional', route => route.fulfill({ status: 404, body: 'Unavailable test dataset' }));
        await page.getByRole('button', { name: 'Area - Non BNIdirect', exact: true }).click();
        await expect(page.getByRole('alert')).toBeVisible();
        await page.setViewportSize({ width: 390, height: 844 });
        await page.getByRole('button', { name: 'Dashboard 4', exact: true }).click();
        await expect(page.locator('.dashboard-placeholder')).toBeVisible();
        await expect(page.getByRole('alert')).toHaveCount(0);
        const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
        expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 2);
        await page.screenshot({ path: 'private/dashboard4-mobile.png', fullPage: true });
    });
});

// Exercise the authenticated repository path with mocked modules, without credentials.
test('Dashboard 4 navigation skips repository loads even when workspace changes', async ({ page }) => {
    await page.route('**/src/lib/supabase.ts', route => route.fulfill({ contentType: 'text/javascript', body: `
        const user = { id: 'test-user', email: 'test@example.invalid', user_metadata: {} };
        export const supabase = { auth: {
            getUser: async () => ({ data: { user } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
        } };
    ` }));
    await page.route('**/src/lib/repository.ts', route => route.fulfill({ contentType: 'text/javascript', body: `
        window.repositoryCalls = [];
        export async function memberships() { return ['test-a', 'test-b'].map(workspace_id => ({
            workspace_id, role: 'viewer', wci_workspaces: { name: workspace_id },
        })); }
        export async function loadRows(workspace, kind) { window.repositoryCalls.push(['rows', workspace, kind]); return []; }
        export async function loadRules(workspace) { window.repositoryCalls.push(['rules', workspace]); return []; }
    ` }));
    await page.goto('/');
    await expect(page.locator('.kpi').first()).toBeVisible();
    const calls = () => page.evaluate(() => (window as unknown as { repositoryCalls: string[][] }).repositoryCalls);
    const initial = await calls();
    expect(initial).toEqual([['rows', 'test-a', 'ijr'], ['rules', 'test-a']]);
    await page.getByRole('button', { name: 'Dashboard 4', exact: true }).click();
    await expect(page.locator('.dashboard-placeholder')).toBeVisible();
    await page.getByLabel('Workspace', { exact: true }).selectOption('test-b');
    await expect(page.getByLabel('Workspace', { exact: true })).toHaveValue('test-b');
    expect(await calls()).toEqual(initial);
    await page.getByRole('button', { name: 'Area - Non BNIdirect', exact: true }).click();
    await expect(page.locator('.kpi').first()).toBeVisible();
    expect(await calls()).toEqual([...initial, ['rows', 'test-b', 'regional'], ['rules', 'test-b']]);
});

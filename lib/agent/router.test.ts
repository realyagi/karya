import { describe, expect, it } from 'vitest';
import { routeVoiceIntent } from './router';

describe('voice tool router', () => {
  it('routes weather with an explicit city', () => {
    expect(routeVoiceIntent("What's the weather in Delhi?").toolName).toBe('weather.current');
  });

  it('asks for a location when weather has no city', () => {
    expect(routeVoiceIntent("What's the weather?").kind).toBe('clarification');
  });

  it('routes current research and provider reads', () => {
    expect(routeVoiceIntent('Search the web for the latest Minecraft update').toolName).toBe('research.search');
    expect(routeVoiceIntent('Show my GitHub repositories').toolName).toBe('github.repositories');
    expect(routeVoiceIntent("What's on my calendar today?").toolName).toBe('calendar.list');
  });

  it('routes browser extension commands correctly', () => {
    expect(routeVoiceIntent('What tab am I looking at?').toolName).toBe('browser.get_active_tab');
    expect(routeVoiceIntent('Read this page').toolName).toBe('browser.get_page_text');
    expect(routeVoiceIntent('Scroll down').toolName).toBe('browser.scroll');
    expect(routeVoiceIntent('Find download button on this page').toolName).toBe('browser.find_text');
    expect(routeVoiceIntent('What text is selected?').toolName).toBe('browser.get_selected_text');
    expect(routeVoiceIntent('Open https://github.com in a new tab').toolName).toBe('browser.open_url');
  });

  it('routes desktop bridge commands safely', () => {
    expect(routeVoiceIntent('Open notepad').toolName).toBe('desktop.open_application');
    expect(routeVoiceIntent('Launch calculator').toolName).toBe('desktop.open_application');
    expect(routeVoiceIntent('Open my downloads folder').toolName).toBe('desktop.open_folder');
    expect(routeVoiceIntent('Take a screenshot').toolName).toBe('desktop.take_screenshot');
    expect(routeVoiceIntent('What are my system specs?').toolName).toBe('desktop.get_system_info');
    expect(routeVoiceIntent('Create a file notes.txt with hello world').toolName).toBe('desktop.create_local_file');
    expect(routeVoiceIntent('Read a selected file').toolName).toBe('desktop.read_selected_file');
  });

  it('routes UI voice control commands correctly', () => {
    expect(routeVoiceIntent('Open settings').toolName).toBe('karya.ui.open_settings');
    expect(routeVoiceIntent('Open integrations').toolName).toBe('karya.ui.open_integrations');
    expect(routeVoiceIntent('Open appearance').toolName).toBe('karya.ui.open_appearance');
    expect(routeVoiceIntent('Open privacy').toolName).toBe('karya.ui.open_privacy');
    expect(routeVoiceIntent('Open account').toolName).toBe('karya.ui.open_account');
    expect(routeVoiceIntent('Change theme').toolName).toBe('karya.ui.change_appearance');
    expect(routeVoiceIntent('Can you change your voice?').toolName).toBe('karya.ui.change_voice');
    expect(routeVoiceIntent('Open voice settings').toolName).toBe('karya.ui.open_voice');
    expect(routeVoiceIntent('Access my browser').toolName).toBe('karya.ui.open_browser_companion');
  });

  it('routes real daily plan commands correctly', () => {
    expect(routeVoiceIntent('Create a plan for today').toolName).toBe('karya.plan.create');
    expect(routeVoiceIntent('Open my plan').toolName).toBe('karya.ui.open_plans');
    expect(routeVoiceIntent('Mark chemistry done').toolName).toBe('karya.plan.mark_item_done');
    expect(routeVoiceIntent("What's left in my plan?").toolName).toBe('karya.plan.status');
  });
});


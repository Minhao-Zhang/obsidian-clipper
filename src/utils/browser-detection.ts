interface KagiWindow extends Window {
	KAGI?: any;
}

interface NavigatorExtended extends Navigator {
	brave?: {
		isBrave: () => Promise<boolean>;
	};
}

declare const window: KagiWindow | undefined;

export async function detectBrowser(): Promise<'chrome' | 'firefox' | 'firefox-mobile' | 'brave' | 'edge' | 'safari' | 'mobile-safari' | 'ipad-os' | 'orion' | 'other'> {
	try {
		// MV3 service workers have no `window`. Do **not** use `typeof browser` first — in Chromium,
		// webextension-polyfill still defines `browser`, so that heuristic wrongly returned "firefox"
		// and skipped Chrome-only tab listeners (see background setupTabListeners).
		if (typeof window === 'undefined' || !window) {
			const ua = (typeof self !== 'undefined' && self.navigator?.userAgent || '').toLowerCase();
			if (ua.includes('firefox')) {
				return ua.includes('mobile') ? 'firefox-mobile' : 'firefox';
			}
			if (ua.indexOf('edg/') > -1) {
				return 'edge';
			}
			if (ua.indexOf('chrome') > -1) {
				const nav = (typeof self !== 'undefined' ? self.navigator : undefined) as NavigatorExtended | undefined;
				if (nav?.brave) {
					try {
						if (await nav.brave.isBrave()) {
							return 'brave';
						}
					} catch {
						/* ignore */
					}
				}
				return 'chrome';
			}
			if (ua.includes('safari')) {
				if (ua.includes('ipad')) {
					return 'ipad-os';
				}
				if (ua.includes('mobile') || ua.includes('iphone')) {
					return 'mobile-safari';
				}
				return 'safari';
			}
			if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
				return 'chrome';
			}
			if (typeof browser !== 'undefined') {
				return 'firefox';
			}
			return 'other';
		}
		
		// Check for Orion first since its userAgent is Safari
		if (typeof window.KAGI !== 'undefined') {
			return 'orion';
		}

		const userAgent = navigator.userAgent.toLowerCase();
		
		if (userAgent.includes('firefox')) {
			return userAgent.includes('mobile') ? 'firefox-mobile' : 'firefox';
		} else if (userAgent.indexOf("edg/") > -1) {
			return 'edge';
		} else if (userAgent.indexOf("chrome") > -1) {
			// Check for Brave
			const nav = navigator as NavigatorExtended;
			if (nav.brave && await nav.brave.isBrave()) {
				return 'brave';
			}
			return 'chrome';
		} else if (userAgent.includes('safari')) {
			if (isIPad()) {
				return 'ipad-os';
			} else if (userAgent.includes('mobile') || userAgent.includes('iphone')) {
				return 'mobile-safari';
			}
			return 'safari';
		} else {
			return 'other';
		}
	} catch (error) {
		console.error('Error detecting browser:', error);
		return 'other';
	}
}

function isIPad(): boolean {
	return navigator.userAgent.includes('iPad') ||
		(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function detectOS(): 'ios' | 'macos' | 'windows' | 'android' | 'linux' | 'other' {
	const platform = ((navigator as any).userAgentData?.platform || navigator.platform || '').toLowerCase();
	const ua = navigator.userAgent.toLowerCase();
	if (/iphone|ipad|ipod/.test(ua) || (/mac/.test(platform) && navigator.maxTouchPoints > 1)) return 'ios';
	if (/mac/.test(platform) || /macintosh/.test(ua)) return 'macos';
	if (/win/.test(platform)) return 'windows';
	if (/android/.test(ua)) return 'android';
	if (/linux/.test(platform)) return 'linux';
	return 'other';
}

export async function addBrowserClassToHtml() {
	const browser = await detectBrowser();
	const htmlElement = document.documentElement;

	// Remove any existing browser classes
	htmlElement.classList.remove(
		'is-firefox-mobile',
		'is-chromium',
		'is-firefox',
		'is-edge',
		'is-chrome',
		'is-brave',
		'is-safari',
		'is-mobile-safari',
		'is-ipad-os',
		'is-orion'
	);

	const os = detectOS();
	if (os === 'macos') htmlElement.classList.add('is-macos');
	else if (os === 'ios') htmlElement.classList.add('is-ios');

	// Add the appropriate class based on the detected browser
	switch (browser) {
		case 'firefox-mobile':
			htmlElement.classList.add('is-mobile', 'is-firefox-mobile', 'is-firefox');
			break;
		case 'firefox':
			htmlElement.classList.add('is-firefox');
			break;
		case 'edge':
			htmlElement.classList.add('is-chromium', 'is-edge');
			break;
		case 'chrome':
			htmlElement.classList.add('is-chromium', 'is-chrome');
			break;
		case 'brave':
			htmlElement.classList.add('is-chromium','is-brave');
			break;
		case 'safari':
			htmlElement.classList.add('is-safari');
			break;
		case 'mobile-safari':
			htmlElement.classList.add('is-mobile', 'is-mobile-safari', 'is-safari');
			break;
		case 'ipad-os':
			htmlElement.classList.add('is-tablet', 'is-ipad-os', 'is-safari');
			break;
		case 'orion':
			htmlElement.classList.add('is-orion');
			break;
		default:
			// For 'other' browsers, we don't add any class
			break;
	}
}
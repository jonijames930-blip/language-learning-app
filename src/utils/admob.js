import { Capacitor } from '@capacitor/core';

let admobPlugin = null;
let bannerShown = false;
let interstitialLoaded = false;

// Google AdMob test IDs
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
const TEST_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';

async function getAdMob() {
  if (admobPlugin) return admobPlugin;
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.initialize({
      initializeForTesting: true,
    });
    admobPlugin = AdMob;
    return AdMob;
  } catch (e) {
    console.error('AdMob init failed:', e);
    return null;
  }
}

export async function showBanner() {
  if (bannerShown) return;
  const AdMob = await getAdMob();
  if (!AdMob) return;
  try {
    const { BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob');
    await AdMob.showBanner({
      adId: TEST_BANNER_ID,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    });
    bannerShown = true;
  } catch (e) {
    console.error('Banner failed:', e);
  }
}

export async function prepareInterstitial() {
  const AdMob = await getAdMob();
  if (!AdMob) return;
  try {
    await AdMob.prepareInterstitial({
      adId: TEST_INTERSTITIAL_ID,
    });
    interstitialLoaded = true;
  } catch (e) {
    console.error('Interstitial prepare failed:', e);
  }
}

export async function showInterstitial() {
  const AdMob = await getAdMob();
  if (!AdMob || !interstitialLoaded) return;
  try {
    await AdMob.showInterstitial();
    interstitialLoaded = false;
    setTimeout(() => prepareInterstitial(), 1000);
  } catch (e) {
    console.error('Interstitial show failed:', e);
    interstitialLoaded = false;
    prepareInterstitial();
  }
}

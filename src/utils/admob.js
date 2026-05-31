import { Capacitor } from '@capacitor/core';

let admobPlugin = null;
let bannerShown = false;
let interstitialLoaded = false;
let rewardedLoaded = false;
let lessonsCompletedSinceLastAd = 0;

const BANNER_ID = 'ca-app-pub-8194899848087880/9546157452';
const INTERSTITIAL_ID = 'ca-app-pub-8194899848087880/6526232126';
const REWARDED_ID = 'ca-app-pub-8194899848087880/5683923746';

async function getAdMob() {
  if (admobPlugin) return admobPlugin;
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.initialize({});
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
      adId: BANNER_ID,
      adSize: BannerAdSize.BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    });
    bannerShown = true;
  } catch (e) {
    console.error('Banner failed:', e);
  }
}

export async function hideBanner() {
  const AdMob = await getAdMob();
  if (!AdMob || !bannerShown) return;
  try {
    await AdMob.hideBanner();
    bannerShown = false;
  } catch (e) {
    console.error('Hide banner failed:', e);
  }
}

export async function prepareInterstitial() {
  const AdMob = await getAdMob();
  if (!AdMob) return;
  try {
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID });
    interstitialLoaded = true;
  } catch (e) {
    console.error('Interstitial prepare failed:', e);
  }
}

export async function showInterstitialOnLessonComplete() {
  lessonsCompletedSinceLastAd++;
  if (lessonsCompletedSinceLastAd < 3) return false;
  const AdMob = await getAdMob();
  if (!AdMob || !interstitialLoaded) return false;
  try {
    await AdMob.showInterstitial();
    interstitialLoaded = false;
    lessonsCompletedSinceLastAd = 0;
    setTimeout(() => prepareInterstitial(), 1000);
    return true;
  } catch (e) {
    console.error('Interstitial show failed:', e);
    interstitialLoaded = false;
    prepareInterstitial();
    return false;
  }
}

export async function prepareRewarded() {
  const AdMob = await getAdMob();
  if (!AdMob) return;
  try {
    await AdMob.prepareRewardVideoAd({ adId: REWARDED_ID });
    rewardedLoaded = true;
  } catch (e) {
    console.error('Rewarded prepare failed:', e);
  }
}

export async function showRewarded() {
  const AdMob = await getAdMob();
  if (!AdMob || !rewardedLoaded) {
    return true;
  }
  try {
    const result = await AdMob.showRewardVideoAd();
    rewardedLoaded = false;
    setTimeout(() => prepareRewarded(), 1000);
    return true;
  } catch (e) {
    console.error('Rewarded show failed:', e);
    rewardedLoaded = false;
    prepareRewarded();
    return false;
  }
}

export function isRewardedReady() {
  return rewardedLoaded;
}

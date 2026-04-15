import ReactPixel from 'react-facebook-pixel';

const PIXEL_ID = '1499753308520482';

export function initPixel() {
  ReactPixel.init(PIXEL_ID, {}, {
    autoConfig: true,
    debug: false,
  });
  ReactPixel.pageView();
}

export function pixelPurchase(value) {
  ReactPixel.track('Purchase', {
    value: value,
    currency: 'BRL',
  });
}

export function pixelInitiateCheckout() {
  ReactPixel.track('InitiateCheckout');
}

export function pixelLead() {
  ReactPixel.track('Lead');
}
<template>
  <div class="ai-product-backdrop" aria-hidden="true">
    <img class="product-symbol symbol-codex" src="/assets/brands/codex.png" alt="" draggable="false" decoding="async">
    <img class="product-symbol symbol-deepseek line-symbol" src="/assets/brands/deepseek.svg" alt="" draggable="false" decoding="async">
    <img class="product-symbol symbol-doubao app-symbol" src="/assets/brands/doubao.png" alt="" draggable="false" decoding="async" loading="lazy">
    <img class="product-symbol symbol-zhipu app-symbol" src="/assets/brands/zhipu.png" alt="" draggable="false" decoding="async" loading="lazy">
  </div>
</template>

<style scoped>
.ai-product-backdrop{position:absolute;inset:0;z-index:-1;overflow:hidden;pointer-events:none;user-select:none}
.product-symbol{position:absolute;display:block;object-fit:contain;opacity:.065}
.line-symbol{filter:brightness(0) invert(87%) sepia(16%) saturate(375%) hue-rotate(91deg) brightness(91%)}
.app-symbol{filter:grayscale(1) sepia(.4) hue-rotate(95deg) saturate(.75) brightness(1.25);border-radius:28px;opacity:.055}
.symbol-codex{width:180px;height:180px;top:240px;left:max(-65px,calc((100% - 1180px)/2 - 110px));filter:grayscale(1) sepia(.4) hue-rotate(95deg) saturate(.75);mask-image:url('/assets/brands/codex.png');mask-mode:luminance;mask-size:100% 100%;mask-repeat:no-repeat;border-radius:28px}
.symbol-deepseek{width:210px;height:180px;top:460px;right:max(-75px,calc((100% - 1180px)/2 - 130px))}
.symbol-doubao{width:160px;height:160px;top:950px;left:max(-60px,calc((100% - 1180px)/2 - 100px))}
.symbol-zhipu{width:170px;height:170px;top:1300px;right:max(-65px,calc((100% - 1180px)/2 - 105px))}
@media(max-width:720px){.product-symbol{width:130px;height:130px;opacity:.045}.app-symbol{border-radius:23px;opacity:.04}.symbol-codex{left:-72px;top:240px}.symbol-deepseek{right:-72px;top:460px}.symbol-doubao{left:-74px;top:950px}.symbol-zhipu{right:-74px;top:1300px}}
@media print{.ai-product-backdrop{display:none}}
</style>

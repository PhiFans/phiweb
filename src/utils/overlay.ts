
const qs = (selector: string) => document.querySelector(selector) as HTMLDivElement | null;

const doms = {
  overlay: qs('div.loading-overlay')!,
  title: qs('div.loading-overlay .title')!,
  subtitle: qs('div.loading-overlay .subtitle')!,
  actions: qs('div.loading-overlay .actions')!,
};

export const show = () => doms.overlay.classList.add('show');

export const hide = () => doms.overlay.classList.remove('show');

export const setTitle = (title: string) => doms.title.innerText = title;

export const setSubtitle = (subtitle: string) => doms.subtitle.innerText = subtitle;

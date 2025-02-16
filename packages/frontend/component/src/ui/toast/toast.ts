// Copyright: https://github.com/toeverything/blocksuite/commit/8032ef3ab97aefce01664b36502fc392c5db8b78#diff-bf5b41be21936f9165a8400c7f20e24d3dbc49644ba57b9258e0943f0dc1c464
import { DebugLogger } from '@affine/debug';
import type { TemplateResult } from 'lit';
import { css, html } from 'lit';

const logger = new DebugLogger('toast');

export const sleep = (ms = 0) =>
  new Promise(resolve => setTimeout(resolve, ms));

let ToastContainer: HTMLDivElement | null = null;

/**
 * DO NOT USE FOR USER INPUT
 * See https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
 */
const htmlToElement = <T extends ChildNode>(html: string | TemplateResult) => {
  const template = document.createElement('template');
  if (typeof html === 'string') {
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
  } else {
    const { strings, values } = html;
    const v = [...values, '']; // + last empty part
    template.innerHTML = strings.reduce((acc, cur, i) => acc + cur + v[i], '');
  }
  return template.content.firstChild as T;
};

const createToastContainer = (portal?: HTMLElement) => {
  portal = portal || document.body;
  const styles = css`
    position: absolute;
    z-index: 9999;
    top: 16px;
    left: 16px;
    right: 16px;
    bottom: 78px;
    pointer-events: none;
    display: flex;
    flex-direction: column-reverse;
    align-items: center;
  `;
  const template = html`<div
    style="${styles}"
    data-testid="affine-toast-container"
  ></div>`;
  const element = htmlToElement<HTMLDivElement>(template);
  portal.appendChild(element);
  return element;
};

export type ToastOptions = {
  duration?: number;
  portal?: HTMLElement;
};

/**
 * @example
 * ```ts
 * toast('Hello World');
 * ```
 */
export const toast = (
  message: string,
  { duration = 2500, portal }: ToastOptions = {
    duration: 2500,
  }
) => {
  if (!ToastContainer || (portal && !portal.contains(ToastContainer))) {
    ToastContainer = createToastContainer(portal);
  }

  const styles = css`
    max-width: 480px;
    text-align: center;
    font-family: var(--affine-font-family);
    font-size: var(--affine-font-sm);
    padding: 6px 12px;
    margin: 10px 0 0 0;
    color: var(--affine-white);
    background: var(--affine-tooltip);
    box-shadow: var(--affine-float-button-shadow);
    border-radius: 10px;
    transition: all 300ms cubic-bezier(0.25, 0.1, 0.25, 1);
    opacity: 0;
  `;

  const template = html`<div
    style="${styles}"
    data-testid="affine-toast"
  ></div>`;
  const element = htmlToElement<HTMLDivElement>(template);
  // message is not trusted
  element.textContent = message;
  ToastContainer.appendChild(element);

  logger.debug(`toast with message: "${message}"`);
  window.dispatchEvent(
    new CustomEvent('affine-toast:emit', { detail: message })
  );

  const fadeIn = [
    {
      opacity: 0,
    },
    { opacity: 1 },
  ];

  const options = {
    duration: 300,
    easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    fill: 'forwards' as const,
  } satisfies KeyframeAnimationOptions;

  element.animate(fadeIn, options);

  setTimeout(() => {
    const animation = element.animate(
      // fade out
      fadeIn.reverse(),
      options
    );
    animation.finished
      .then(() => {
        element.style.maxHeight = '0';
        element.style.margin = '0';
        element.style.padding = '0';
        // wait for transition
        // ToastContainer = null;
        element.addEventListener('transitionend', () => {
          element.remove();
        });
      })
      .catch(err => {
        console.error(err);
      });
  }, duration);
  return element;
};

export default toast;

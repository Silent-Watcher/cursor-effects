import gsap from 'gsap'
import './cursor.css'

export interface CursorOptions {
  /** Element that the cursor is attached to and that listens for pointer events. */
  container?: HTMLElement
  /** Follow duration in seconds. */
  speed?: number
  /** GSAP ease used while following the pointer. */
  ease?: string
  /** Delay in ms before the next show() snaps instead of gliding after a hide(). */
  visibleTimeout?: number
}

/** Elements that switch the cursor to the "-pointer" state. */
const POINTER_SELECTOR = 'a,input,textarea,button'

/** Strength of the pull towards the center of a [data-cursor-stick] element. */
const STICK_PULL = 0.15

/**
 * Calls enter/leave for every element matching `selector` that the pointer entered or left.
 * Equivalent to a delegated mouseenter/mouseleave: nested matches each get their own call.
 */
function delegateHover(
  root: HTMLElement,
  selector: string,
  onEnter: (el: HTMLElement) => void,
  onLeave: (el: HTMLElement) => void,
  signal: AbortSignal,
): void {
  const walk = (event: MouseEvent, callback: (el: HTMLElement) => void) => {
    if (!(event.target instanceof Element)) return
    const related = event.relatedTarget as Node | null

    let el = event.target.closest<HTMLElement>(selector)
    while (el && root.contains(el)) {
      if (!related || !el.contains(related)) callback(el)
      el = el.parentElement?.closest<HTMLElement>(selector) ?? null
    }
  }

  root.addEventListener('mouseover', (e) => walk(e, onEnter), { signal })
  root.addEventListener('mouseout', (e) => walk(e, onLeave), { signal })
}

/** Splits "a b c" into class names, ignoring extra whitespace. */
const tokens = (value: string) => value.split(/\s+/).filter(Boolean)

export class Cursor {
  readonly el = document.createElement('div')
  private readonly label = document.createElement('div')
  private readonly options: Required<CursorOptions>
  private readonly abort = new AbortController()

  private pos = { x: 0, y: 0 }
  private stick: { x: number; y: number } | null = null
  private shown = false
  private visible = false
  private visibleTimer?: number

  constructor(options: CursorOptions = {}) {
    this.options = {
      container: document.body,
      speed: 0.7,
      ease: 'expo.out',
      visibleTimeout: 300,
      ...options,
    }

    this.el.className = 'fx-cursor'
    this.label.className = 'fx-cursor-label'
    this.el.append(this.label)
    this.options.container.append(this.el)

    this.bind()
    this.move(-window.innerWidth, -window.innerHeight, 0)
  }

  private bind(): void {
    const { container } = this.options
    const { signal } = this.abort
    const on = <K extends keyof HTMLElementEventMap>(
      type: K,
      handler: (event: HTMLElementEventMap[K]) => void,
    ) => container.addEventListener(type, handler, { signal })

    on('mouseleave', () => this.hide())
    on('mouseenter', () => this.show())
    on('mousedown', () => this.setState('-active'))
    on('mouseup', () => this.removeState('-active'))
    on('mousemove', (e) => {
      this.pos = {
        x: this.stick ? this.stick.x - (this.stick.x - e.clientX) * STICK_PULL : e.clientX,
        y: this.stick ? this.stick.y - (this.stick.y - e.clientY) * STICK_PULL : e.clientY,
      }
      this.update()
    })

    const hover = (
      selector: string,
      enter: (el: HTMLElement) => void,
      leave: (el: HTMLElement) => void,
    ) => delegateHover(container, selector, enter, leave, signal)

    hover(
      POINTER_SELECTOR,
      () => this.setState('-pointer'),
      () => this.removeState('-pointer'),
    )
    hover(
      'iframe',
      () => this.hide(),
      () => this.show(),
    )
    hover(
      '[data-cursor]',
      (el) => this.setState(el.dataset.cursor ?? ''),
      (el) => this.removeState(el.dataset.cursor ?? ''),
    )
    hover(
      '[data-cursor-text]',
      (el) => this.setText(el.dataset.cursorText ?? ''),
      () => this.removeText(),
    )
    hover(
      '[data-cursor-stick]',
      (el) => this.setStick(el.dataset.cursorStick ?? ''),
      () => this.removeStick(),
    )
  }

  /** Adds one or more state classes (space separated). */
  setState(state: string): void {
    this.el.classList.add(...tokens(state))
  }

  removeState(state: string): void {
    this.el.classList.remove(...tokens(state))
  }

  toggleState(state: string): void {
    tokens(state).forEach((name) => this.el.classList.toggle(name))
  }

  setText(text: string): void {
    this.label.textContent = text
    this.el.classList.add('-text')
  }

  removeText(): void {
    this.el.classList.remove('-text')
  }

  /** Sticks the cursor to the center of the element matching `selector`. */
  setStick(selector: string): void {
    const target = document.querySelector(selector)
    if (!target) return

    const rect = target.getBoundingClientRect()
    this.stick = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    this.move(this.stick.x, this.stick.y, 5)
  }

  removeStick(): void {
    this.stick = null
  }

  show(): void {
    if (this.shown && this.visible) return
    window.clearTimeout(this.visibleTimer)
    this.shown = true
    this.el.classList.add('-visible')
    this.visibleTimer = window.setTimeout(() => (this.visible = true))
  }

  hide(): void {
    window.clearTimeout(this.visibleTimer)
    this.shown = false
    this.el.classList.remove('-visible')
    this.visibleTimer = window.setTimeout(() => (this.visible = false), this.options.visibleTimeout)
  }

  /** Removes the cursor element and every listener. */
  destroy(): void {
    window.clearTimeout(this.visibleTimer)
    this.abort.abort()
    gsap.killTweensOf(this.el)
    this.el.remove()
  }

  private update(): void {
    this.move()
    this.show()
  }

  private move(x = this.pos.x, y = this.pos.y, duration = this.options.speed): void {
    gsap.to(this.el, {
      x,
      y,
      force3D: true,
      overwrite: true,
      ease: this.options.ease,
      duration: this.visible ? duration : 0,
    })
  }
}

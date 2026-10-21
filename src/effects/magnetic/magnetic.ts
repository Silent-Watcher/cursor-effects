import gsap from 'gsap'
import './magnetic.css'

export interface MagneticOptions {
  /** Vertical pull factor. */
  y?: number
  /** Horizontal pull factor. */
  x?: number
  /** Follow duration in seconds. */
  s?: number
  /** Release duration in seconds. */
  rs?: number
}

const DEFAULTS: Required<MagneticOptions> = { y: 0.2, x: 0.2, s: 0.2, rs: 0.7 }

const initialized = new WeakSet<HTMLElement>()

/** Reads options from the data-magnetic attribute, e.g. data-magnetic='{"x":0.4}'. */
function readAttribute(el: HTMLElement): MagneticOptions {
  const raw = el.dataset.magnetic
  if (!raw) return {}
  try {
    return JSON.parse(raw) as MagneticOptions
  } catch {
    console.warn('Magnetic: invalid JSON in data-magnetic', el)
    return {}
  }
}

export class Magnetic {
  private readonly options: Required<MagneticOptions>
  private readonly abort = new AbortController()
  private rect = new DOMRect()

  constructor(
    private readonly el: HTMLElement,
    options: MagneticOptions = {},
  ) {
    this.options = { ...DEFAULTS, ...options, ...readAttribute(el) }

    if (initialized.has(el)) return
    initialized.add(el)

    this.bind()
  }

  private bind(): void {
    const { signal } = this.abort

    this.el.addEventListener('mouseenter', () => (this.rect = this.el.getBoundingClientRect()), { signal })

    this.el.addEventListener(
      'mousemove',
      (e) => {
        const x = (e.clientX - this.rect.left - this.rect.width / 2) * this.options.x
        const y = (e.clientY - this.rect.top - this.rect.height / 2) * this.options.y
        this.move(x, y, this.options.s)
      },
      { signal },
    )

    this.el.addEventListener('mouseleave', () => this.move(0, 0, this.options.rs), { signal })
  }

  /** Removes listeners and returns the element to its original position. */
  destroy(): void {
    this.abort.abort()
    initialized.delete(this.el)
    gsap.killTweensOf(this.el)
    gsap.set(this.el, { x: 0, y: 0 })
  }

  private move(x: number, y: number, duration: number): void {
    gsap.to(this.el, { x, y, force3D: true, overwrite: true, duration })
  }
}

/** Applies the effect to every [data-magnetic] element inside `root`. */
export function initMagnetic(root: ParentNode = document): Magnetic[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-magnetic]'), (el) => new Magnetic(el))
}

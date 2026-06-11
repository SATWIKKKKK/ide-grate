'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function GsapMotion() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    gsap.registerPlugin(ScrollTrigger)
    const reduced = prefersReducedMotion()

    const ctx = gsap.context(() => {
      const revealItems = gsap.utils.toArray<HTMLElement>('[data-gsap="fade-up"]')
      revealItems.forEach((el) => {
        gsap.fromTo(
          el,
          reduced ? { opacity: 0 } : { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: reduced ? 0.12 : 0.72,
            ease: 'power3.out',
            clearProps: 'transform',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
              once: true,
            },
          }
        )
      })

      const staggerGroups = gsap.utils.toArray<HTMLElement>('[data-gsap-stagger]')
      staggerGroups.forEach((group) => {
        const children = group.querySelectorAll<HTMLElement>('[data-gsap-item]')
        if (!children.length) return
        gsap.fromTo(
          children,
          reduced ? { opacity: 0 } : { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: reduced ? 0.12 : 0.54,
            stagger: reduced ? 0 : 0.055,
            ease: 'power3.out',
            clearProps: 'transform',
            scrollTrigger: {
              trigger: group,
              start: 'top 88%',
              once: true,
            },
          }
        )
      })

      const countItems = gsap.utils.toArray<HTMLElement>('[data-gsap-count]')
      countItems.forEach((el) => {
        const end = Number(el.dataset.gsapCount)
        if (!Number.isFinite(end)) return
        const decimals = Number(el.dataset.gsapDecimals || 0)
        const suffix = el.dataset.gsapSuffix || ''
        const state = { value: 0 }
        gsap.to(state, {
          value: end,
          duration: reduced ? 0.01 : 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 92%',
            once: true,
          },
          onUpdate: () => {
            el.textContent = `${state.value.toFixed(decimals)}${suffix}`
          },
        })
      })

      ScrollTrigger.refresh()
    })

    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [pathname])

  return null
}


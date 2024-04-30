import { createReactivePlugin } from '../../utils/private.create/create.js'

import defaultLang from '../../../lang/en-US.js'

function getLocale () {
  if (__QUASAR_SSR_SERVER__) return

  const val = Array.isArray(navigator.languages) === true && navigator.languages.length !== 0
    ? navigator.languages[ 0 ]
    : navigator.language

  if (typeof val === 'string') {
    return val.split(/[-_]/).map((v, i) => (
      i === 0
        ? v.toLowerCase()
        : (
            i > 1 || v.length < 4
              ? v.toUpperCase()
              : (v[ 0 ].toUpperCase() + v.slice(1).toLowerCase())
          )
    )).join('-')
  }
}

const Plugin = createReactivePlugin({
  __qLang: {}
}, {
  // props: object
  // __langConfig: object

  getLocale,

  set (langObject = defaultLang, ssrContext) {
    const lang = {
      ...langObject,
      rtl: langObject.rtl === true,
      getLocale
    }

    if (__QUASAR_SSR_SERVER__) {
      if (ssrContext === void 0) {
        console.error('SSR ERROR: second param required: Lang.set(lang, ssrContext)')
        return
      }

      lang.set = ssrContext.$q.lang.set

      if (ssrContext.$q.config.lang === void 0 || ssrContext.$q.config.lang.noHtmlAttrs !== true) {
        const dir = lang.rtl === true ? 'rtl' : 'ltr'
        const attrs = `lang=${ lang.isoName } dir=${ dir }`

        ssrContext._meta.htmlAttrs = ssrContext.__qPrevLang !== void 0
          ? ssrContext._meta.htmlAttrs.replace(ssrContext.__qPrevLang, attrs)
          : attrs

        ssrContext.__qPrevLang = attrs
      }

      ssrContext.$q.lang = lang
    }
    else {
      lang.set = Plugin.set

      if (Plugin.__langConfig === void 0 || Plugin.__langConfig.noHtmlAttrs !== true) {
        const el = document.documentElement
        el.setAttribute('dir', lang.rtl === true ? 'rtl' : 'ltr')
        el.setAttribute('lang', lang.isoName)
      }

      Object.assign(Plugin.__qLang, lang)
    }
  },

  install ({ $q, lang, ssrContext }) {
    if (__QUASAR_SSR_SERVER__) {
      const initialLang = lang || defaultLang

      $q.lang = {}
      $q.lang.set = langObject => {
        this.set(langObject, ssrContext)
      }

      $q.lang.set(initialLang)

      // one-time SSR server operation
      if (
        this.props === void 0
        || this.props.isoName !== initialLang.isoName
      ) {
        this.props = { ...initialLang }
      }
    }
    else {
      $q.lang = Plugin.__qLang
      Plugin.__langConfig = $q.config.lang

      if (this.__installed === true) {
        lang !== void 0 && this.set(lang)
      }
      else {
        this.props = new Proxy(this.__qLang, {
          get () { return Reflect.get(...arguments) },

          ownKeys (target) {
            return Reflect.ownKeys(target)
              .filter(key => key !== 'set' && key !== 'getLocale')
          }
        })

        this.set(lang || defaultLang)
      }
    }
  }
})

export default Plugin
export { defaultLang }

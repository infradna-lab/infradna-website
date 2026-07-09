import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * 라우트가 바뀔 때 스크롤 위치를 관리한다.
 * - 해시(#projects)가 있으면 해당 섹션으로 이동
 * - 없으면 페이지 최상단으로 이동
 */
function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView()
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}

export default ScrollManager

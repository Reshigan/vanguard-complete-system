import { Outlet } from 'react-router-dom'
import Header from './Header'
import Navigation from './Navigation'

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pb-20">
        <Outlet />
      </main>
      <Navigation />
    </div>
  )
}

export default Layout
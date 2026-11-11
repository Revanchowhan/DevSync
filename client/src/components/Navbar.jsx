import React from 'react'
import { Logo } from './Sidebar.jsx'
import PublicNavbar from './PublicNavbar.jsx'

export { Logo }

export const ALL_STUDENT_NAV = [
  { to: '/dashboard', label: 'Dashboard', milestone: 'm1' },
  { to: '/discover', label: 'Discover', milestone: 'm2' },
  { to: '/ideas', label: 'Ideas', milestone: 'm3' },
  { to: '/my-teams', label: 'My Teams', milestone: 'm3' },
  { to: '/hackathons', label: 'Hackathons', milestone: 'm1' },
  { to: '/messages', label: 'Messages', milestone: 'm4' },
  { to: '/requests', label: 'Requests', milestone: 'm1' },
  { to: '/profile', label: 'Profile', milestone: 'm1' },
]

export default function Navbar() {
  return <PublicNavbar />
}

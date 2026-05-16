import React, { useState, useEffect } from 'react';
import CustomerPage from './CustomerPage';
import AdminPage from './AdminPage';

function getPage() {
  const hash = window.location.hash;
  if (hash === '#/admin') return 'admin';
  return 'customer';
}

export default function App() {
  const [page, setPage] = useState(getPage);

  useEffect(() => {
    const onHashChange = () => setPage(getPage());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (page === 'admin') return <AdminPage />;
  return <CustomerPage />;
}

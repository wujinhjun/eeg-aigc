import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import Button from '@/components/base/button';

import { ChatRecordType } from '@/utils/types';

import style from '@/styles/historyPage.module.css';

export default function HistoryPage() {
  const [historyList, setHistoryList] = useState<ChatRecordType[]>([]);

  useEffect(() => {
    async function fetchData() {
      fetch('/api/eeg-story/history/all')
        .then((res) => res.json())
        .then((res) => {
          setHistoryList(res);
        });
    }

    fetchData();
  }, []);

  return (
    <section className="page-container">
      <header className="flex items-center gap-4 px-4 py-2 border border-[#21957a] mx-4 rounded-2xl">
        <div className="mr-auto">EEG-STUDIO</div>
        <Button category="green">
          <Link to="/">返回首页</Link>
        </Button>
      </header>
      <section className={`${style['history-content-container']}`}>
        {historyList.map((history) => {
          return <div key={history.id}>1</div>;
        })}
      </section>
    </section>
  );
}

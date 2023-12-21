import style from '@/styles/introduction.module.css';
import { Link } from 'react-router-dom';

import Button from '@/components/base/button';
import { useEffect, useState } from 'react';

export default function IntroductionPage() {
  const [storyList, setStoryList] = useState<
    Array<{ id: string; name: string; cover: string }>
  >([]);

  useEffect(() => {
    async function fetchData() {
      fetch('/api/eeg-story/all')
        .then((res) => res.json())
        .then((res) => {
          setStoryList(res);
        });
    }

    fetchData();
  }, []);

  return (
    <section className="page-container">
      <header className={`${style['introduction-header']} py-2`}>
        <span className={`${style['introduction-header-left-logo']}`}>
          EEG-STUDIO
        </span>

        <Button category="red">
          <Link to={'/'}>退出绘画</Link>
        </Button>
      </header>
      <section className={`${style['introduction-content-container']}`}>
        {storyList.map((story) => {
          return (
            <Link
              to={`/drawing/story/${story.id}`}
              key={story.id}
              className={`${style['introduction-content-card-container']}`}
            >
              <img
                className={`${style['introduction-content-card-img']}`}
                src={story.cover}
                alt=""
              />
              <span className={`${style['introduction-content-card-title']}`}>
                {story.name}
              </span>
            </Link>
          );
        })}
      </section>
    </section>
  );
}

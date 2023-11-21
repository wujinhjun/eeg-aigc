import style from '@/styles/homePage.module.css';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className={`${style['homepage-container']}`}>
      <header className={`${style['homepage-header']}`}>
        <span className={`${style['homepage-header-left-logo']}`}>
          EEG-STUDIO
        </span>
        <button className={`primary-button ${1}`}>介绍</button>
        <button className={`primary-button ${1}`}>关于</button>
      </header>

      {/* <div className="flex justify-center items-center"> */}
      <section className={`${style['homepage-content-container']}`}>
        <Link
          to={'/configuration'}
          className={`${style['homepage-content-card-container']}`}
        >
          <img
            className={`${style['homepage-content-card-img']}`}
            src="https://picsum.photos/seed/picsum/320/320"
            alt=""
          />
          <span className={`${style['homepage-content-card-title']}`}>
            设备调试
          </span>
        </Link>

        <Link
          to={'/drawing'}
          className={`${style['homepage-content-card-container']}`}
        >
          <img
            className={`${style['homepage-content-card-img']}`}
            src="https://picsum.photos/seed/picsum/320/320"
            alt=""
          />
          <span className={`${style['homepage-content-card-title']}`}>
            开始画画
          </span>
        </Link>
        <Link
          to={'/history'}
          className={`${style['homepage-content-card-container']}`}
        >
          <img
            className={`${style['homepage-content-card-img']}`}
            src="https://picsum.photos/seed/picsum/320/320"
            alt=""
          />
          <span className={`${style['homepage-content-card-title']}`}>
            绘画记录
          </span>
        </Link>
      </section>
      {/* </div> */}
    </div>
  );
}

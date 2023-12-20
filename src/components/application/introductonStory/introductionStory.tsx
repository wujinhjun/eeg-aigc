import { useState, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

import style from '@/styles/drawingPage.module.css';
import Button from '@/components/base/button';

import { StoryType } from '@/utils/types';

import chatRole from '@/assets/cartoon/chat.svg';
const animationDurationTime = 500;

interface Props {
  isIntroductionStoryProcessing: boolean;
  handleIntroductionStoryProcessing: (isProcessing: boolean) => void;
  currentStory: StoryType | undefined;
}

export default function IntroductionStory({
  isIntroductionStoryProcessing,
  currentStory,
  handleIntroductionStoryProcessing
}: Props) {
  // 轮播图
  // index
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [previousSectionIndex, setPreviousSectionIndex] =
    useState<number>(currentSectionIndex);
  // 是否顺向
  const [slideDirection, setSlideDirection] = useState<
    'direction' | 'negative'
  >('direction');
  // 是否正在切换
  const [isSwitching, setIsSwitching] = useState(false);
  // 动画的计时器
  const animationTimerRef = useRef<number>(0);

  const sectionNumber = useMemo(() => {
    return currentStory ? currentStory.description.length : 0;
  }, [currentStory]);

  const modTheIndex = (index: number) => {
    return (index + sectionNumber) % sectionNumber;
  };

  const slideTo = (index: number) => {
    if (!isSwitching && index !== currentSectionIndex) {
      const targetIndex = modTheIndex(index);
      setIsSwitching(true);

      setSlideDirection(
        targetIndex > currentSectionIndex ? 'direction' : 'negative'
      );
      setCurrentSectionIndex(targetIndex);
      setPreviousSectionIndex(currentSectionIndex);

      animationTimerRef.current = setTimeout(() => {
        setIsSwitching(false);
        animationTimerRef.current = 0;
      }, animationDurationTime);
    }
  };

  const slideToNext = () => {
    slideTo(currentSectionIndex + 1);
  };

  const slideToPrev = () => {
    if (currentSectionIndex === 0) {
      toast.error('已经是第一段剧情了！');
      return;
    }
    slideTo(currentSectionIndex - 1);
  };
  return (
    <section
      className={
        `${style['introduction-container']} ${
          isIntroductionStoryProcessing ? 'introduction' : ''
        } ` + ' grow-0 shrink-0 p-2 w-[100vw] min-w-[100vw] max-w-[100vw] '
      }
    >
      <header className={`${style['introduction-header']} py-2`}>
        <span className={`${style['introduction-header-left-logo']}`}>
          EEG-STUDIO
        </span>
        <Button category="red">退出绘画</Button>
      </header>

      <section className="h-full flex justify-center items-center gap-12">
        <img src={chatRole} alt="" className={'w-[30%] h-fit'} />

        <div className={`${style['introduction-card-wrapper']} w-[35%] `}>
          <div className="z-[101] col-start-1 col-end-2 row-start-1 row-end-2 flex justify-start items-start mt-4 mr-8">
            <button
              onClick={() => {
                setCurrentSectionIndex(0);
              }}
              className="ml-auto decoration-1 underline underline-offset-4 text-[#40A88F] decoration-[#40A88F]"
            >
              重新讲解
            </button>
          </div>
          <section className="col-start-1 col-end-2 row-start-1 row-end-2 grid">
            {currentStory &&
              currentStory.description.map((item, index) => {
                const isCur = index === currentSectionIndex;

                return (
                  <div
                    key={index}
                    className={clsx({
                      [style['introduction-card-container']]: true,
                      [style['introduction-card-container-active']]: isCur,
                      [style['introduction-card-container-out']]:
                        index === previousSectionIndex &&
                        slideDirection === 'direction' &&
                        isSwitching,
                      [style['introduction-card-container-in']]:
                        isCur && slideDirection === 'direction' && isSwitching,
                      [style['introduction-card-container-in-reverse']]:
                        index === previousSectionIndex &&
                        isSwitching &&
                        slideDirection === 'negative',
                      [style['introduction-card-container-out-reverse']]:
                        isCur && slideDirection === 'negative'
                    })}
                    style={{
                      animationDuration: `${animationDurationTime}ms`,
                      transitionDuration: `${animationDurationTime}ms`
                    }}
                  >
                    {item}
                  </div>
                );
              })}
          </section>

          <div
            className={
              'mt-auto mb-8 mx-8 z-[101] col-start-1 col-end-2 row-start-1 row-end-2 flex justify-between ' +
              `${isSwitching ? 'hidden' : ''}`
            }
          >
            <Button category="green" onClick={slideToPrev}>
              上一段剧情
            </Button>

            {currentSectionIndex === sectionNumber - 1 ? (
              <Button
                category="green"
                onClick={() => {
                  console.log('开始绘画');
                  //   setIsIntroductionStoryProcessing(false);
                  handleIntroductionStoryProcessing(false);
                }}
              >
                开始绘画
              </Button>
            ) : (
              <Button category="green" onClick={slideToNext}>
                继续
              </Button>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

import { useState, useMemo, useRef, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { useLocation, useParams, Link } from 'react-router-dom';

import {
  ArrowSmallLeftIcon,
  ArrowSmallRightIcon
} from '@heroicons/react/24/outline';
import {
  fetchEventSource,
  EventStreamContentType
} from '@microsoft/fetch-event-source';
import { nanoid } from 'nanoid';
import { produce } from 'immer';
import toast from 'react-hot-toast';

import Button from '@/components/base/button';
import Dialog from '@/components/base/dialog';
import Loading from '@/components/base/loading';
import UploadPainting from '@/components/application/uploadPainting';
import IntroductionStory from '@/components/application/introductonStory';

import compressImage from '@/utils/compressImage';
import filterTargetDataByEEG from '@/utils/filterTargetDataByEEG';
import translateDataByEEG from '@/utils/translateDataByEEG';
import publicService from '@/service/publicService';

import {
  ChatRecordType,
  ChatRoleEnum,
  ChatTypeEnum,
  StoryType
} from '@/utils/types';

import style from '@/styles/drawingPage.module.css';

import chatRole from '@/assets/cartoon/chat.svg';

const API_KEY = import.meta.env.VITE_OPEN_AI_API_KEY;

class RetriableError extends Error {}
class FatalError extends Error {}

const initialChatData: ChatRecordType[] = [
  {
    id: nanoid(),
    type: ChatTypeEnum.text,
    role: ChatRoleEnum.robot,
    content: '你好，你想绘制怎么样的画呢？',
    time: new Date().getTime().toString(),
    eegStatus: '',
    imgType: ''
  }
];

export default function DrawingPage() {
  // url参数
  const params = useParams<{ id: string }>();

  // 介绍阶段的内容
  // 当前的剧本内容
  const [currentStory, setCurrentStory] = useState<StoryType>();

  // 是否处于介绍阶段
  const [isIntroductionStoryProcessing, setIsIntroductionStoryProcessing] =
    useState(true);

  // 绘画阶段
  // 绘画阶段：是否只显示图片
  const [isOnlyDisplayImg, setIsOnlyDisplayImg] = useState(false);

  const [isUploadingHistory, setIsUploadingHistory] = useState(false);

  // 是否正在绘图
  const [isCreatingPainting, setIsCreatingPainting] = useState(false);

  // 是否正在与机器人对话
  const [isChattingWithRobot, setIsChattingWithRobot] = useState(false);
  const controllerWithRobotRef = useRef<AbortController | null>(null);

  // 当前EEG的状态
  const [currentEegStatus, setCurrentEegStatus] = useState('');

  // 提示栏的index
  const [tipsIndex, setTipsIndex] = useState(0);
  const lastTipsIndex = useRef(0);

  // 聊天记录
  const [chatRecordList, setChatRecordList] =
    useState<ChatRecordType[]>(initialChatData);
  // 筛选后的聊天记录
  const filteredChatRecordList = useMemo(() => {
    if (isOnlyDisplayImg) {
      return chatRecordList.filter((item) => item.type === ChatTypeEnum.img);
    }
    return chatRecordList;
  }, [chatRecordList, isOnlyDisplayImg]);

  // 绘画记录：故事旅程部分
  const paintingListMemo = useMemo(() => {
    return chatRecordList
      .filter((item) => item.type === ChatTypeEnum.img)
      .map((item) => {
        return {
          content: item.content,
          id: item.id,
          type: item.imgType
        };
      });
  }, [chatRecordList]);

  // 当前的图片
  const [currentSketch, setCurrentSketch] = useState<string>('');
  // 当前绘制出的图片
  const [currentPainting, setCurrentPainting] = useState<string>('');
  // 是否打开上传图片的对话框
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // 当前正在进行的聊天内容
  const [currentChatContent, setCurrentChatContent] = useState<string>('');
  const currentChatContentRef = useRef<string>('');

  // 退出流程的对话框
  const [
    isExitDrawingProcessingDialogOpen,
    setIsExitDrawingProcessingDialogOpen
  ] = useState(false);

  // 当前的prompt
  const [currentPaintingPrompt, setCurrentPaintingPrompt] =
    useState<string>('');

  // 关闭上传图片的对话框
  const handleCloseUploadDialog = () => {
    setIsUploadDialogOpen(false);
  };

  // 确认上传图片的对话框
  const handleConfirmUploadDialog = () => {
    setIsUploadDialogOpen(false);
  };

  // 设置绘图记录
  const handleUploadImageForPaintingList = (paint: string) => {
    if (paint.length === 0) {
      toast.error('请先上传图片');
      return;
    }

    // 机器最后一条消息的index
    const lastRobotIndex = chatRecordList
      .map((obj) => obj.role)
      .lastIndexOf(ChatRoleEnum.robot);

    // 逆序寻找最后一个用户上传的图片
    let lastUserPaintingIndex = -1;

    for (let i = chatRecordList.length - 1; i >= 0; i--) {
      if (
        chatRecordList[i].role === ChatRoleEnum.user &&
        chatRecordList[i].type === ChatTypeEnum.img
      ) {
        lastUserPaintingIndex = i;
        break;
      }
    }

    // 如果最后用户的图片在最后机器人的回复之后
    if (lastUserPaintingIndex > lastRobotIndex) {
      toast.error('请等待机器人回复后再上传图片');
      return;
    }

    handleAddChatRecordList(ChatTypeEnum.img, ChatRoleEnum.user, paint);
    setCurrentSketch(paint);

    setTimeout(() => {
      handleAddChatRecordList(
        ChatTypeEnum.text,
        ChatRoleEnum.robot,
        '你是想要画这个吗？那你可以点击右下角的按钮开始绘画哦'
      );
    }, 1000);
  };

  // 更改聊天内容
  const handleChangeCurrentSketchPrompt = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setCurrentPaintingPrompt(e.target.value);
  };

  // 提交prompt，与机器人对话
  const handleSubmitPromptToChat = () => {
    if (currentPaintingPrompt.length === 0) {
      toast.error('请输入内容');
      return;
    }

    handleAddChatRecordList(
      ChatTypeEnum.text,
      ChatRoleEnum.user,
      currentPaintingPrompt
    );

    setIsChattingWithRobot(true);

    controllerWithRobotRef.current = new AbortController();

    fetchEventSource('https://api.openai-proxy.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: currentPaintingPrompt }],
        stream: true
      }),
      signal: controllerWithRobotRef.current.signal,

      async onopen(response) {
        if (
          response.ok &&
          response.headers.get('content-type') === EventStreamContentType
        ) {
          return; // everything's good
        } else if (
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429
        ) {
          // client-side errors are usually non-retriable:
          throw new FatalError();
        } else {
          return;
          //   throw new RetriableError();
        }
      },
      onmessage(msg) {
        if (msg.event === 'FatalError') {
          throw new FatalError(msg.data);
        }

        const data = msg.data;

        if (data === '[DONE]') {
          setIsChattingWithRobot(false);

          handleAddChatRecordList(
            ChatTypeEnum.text,
            ChatRoleEnum.robot,
            currentChatContentRef.current
          );

          setCurrentChatContent('');
          currentChatContentRef.current = '';

          return;
        }

        const result = JSON.parse(data).choices[0];

        if (result.finish_reason === 'stop') {
          toast.success('对话完成');
        } else {
          const msg = result.delta.content;
          setCurrentChatContent((prev) => (prev += msg));
          currentChatContentRef.current += msg;
        }
      },
      onclose() {
        console.log('close');

        return;
      },
      onerror(err) {
        console.log(err);

        if (err instanceof FatalError) {
          throw err; // rethrow to stop the operation
        } else {
          console.error(err);
          return;
        }
      }
    })
      .then(() => {
        setCurrentPaintingPrompt('');
      })
      .finally(() => {
        setIsChattingWithRobot(false);
      });
  };

  // 打断对话
  const handleBreakChatWithRobot = () => {
    if (!controllerWithRobotRef.current) {
      return;
    }

    controllerWithRobotRef.current.abort();

    setCurrentChatContent('');
    currentChatContentRef.current = '';
  };

  // 修改聊天记录
  const handleAddChatRecordList = (
    type: ChatTypeEnum,
    role: ChatRoleEnum,
    content: string
  ) => {
    const record: ChatRecordType = {
      id: nanoid(),
      type,
      role,
      content,
      time: new Date().getTime().toString(),
      eegStatus: currentEegStatus,
      imgType: ''
    };

    if (type === ChatTypeEnum.img) {
      if (role === ChatRoleEnum.user) {
        record.imgType = 'sketch';
      } else {
        record.imgType = 'painting';
      }
    }

    setChatRecordList((prev) => [...prev, record]);

    return chatRecordList.length;
  };

  const handleDeleteChatRecordList = (index: number) => {
    setChatRecordList((prev) => {
      return produce(prev, (draft) => {
        draft.splice(index, 1);
      });
    });
  };

  const handleUpdateChatRecordList = (
    index: number,
    content: Partial<ChatRecordType>
  ) => {
    setChatRecordList((prev) => {
      return produce(prev, (draft) => {
        draft[index] = {
          ...draft[index],
          ...content
        };
      });
    });
  };

  // 进行绘画
  const handleSubmitPromptToPainting = () => {
    if (currentSketch.length === 0) {
      toast.error('请先上传图片');
      return;
    }

    setIsCreatingPainting(true);
    compressImage(currentSketch)
      .then((res) => {
        return fetch('/api/imgs/eegGenerateImg', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: currentEegStatus,
            initImage: res,
            prompt: currentPaintingPrompt
          })
        });
      })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res.code !== 200) {
          throw res;
        }

        const paint = 'data:image/png;base64,' + res.data[0];
        setCurrentPainting(paint);

        handleAddChatRecordList(ChatTypeEnum.img, ChatRoleEnum.robot, paint);
        setCurrentSketch('');
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsCreatingPainting(false);
      });
  };

  const handleNextScene = () => {
    const len = currentStory ? currentStory.tips.length - 1 : 0;
    if (tipsIndex === len) {
      toast.error('已经是最后一个情节了');
      return;
    }

    if (
      tipsIndex + 1 >
      paintingListMemo.filter((item) => item.type === 'painting').length
    ) {
      toast.error('请先完成当前情节');
      return;
    }

    lastTipsIndex.current = tipsIndex;

    setTipsIndex((prev) => prev + 1);

    setCurrentPainting('');
  };

  //TODO 上传此刻的记录
  const handleConfirmThisStory = () => {
    const handleUploadPaintingHistory = async () => {
      const len = currentStory ? currentStory.tips.length - 1 : 0;
      //   if (tipsIndex < len) {
      //     toast.error('还未完成全部环节');
      //     return;
      //   }

      const name = params.id;

      const imgsList = chatRecordList
        .filter((item) => item.type === ChatTypeEnum.img)
        .map((item) => {
          return {
            content: item.content,
            imgType: item.imgType
          };
        });

      const promises = imgsList.map((item, index) => {
        return publicService.uploadImageToGithubWithRetry(
          `${name}-${index}`,
          item.imgType,
          item.content
        );
      });

      const imgs = await Promise.all(promises)
        .then((res) => {
          console.log(res);
          return res;
        })
        .then((res) => {
          return res.map((item, index) => ({
            imgUrl: item,
            imgType: imgsList[index].imgType
          }));
        })
        .catch((err) => {
          console.error(err);
          return [] as Array<{
            imgUrl: string;
            imgType: '' | 'sketch' | 'painting';
          }>;
        });

      let index = 0;

      const chatRecord = [...chatRecordList].map((item) => {
        if (item.type === ChatTypeEnum.img) {
          item.content = imgs[index].imgUrl;
          index++;
        }
        return item;
      });

      const historyData = {
        id: nanoid(),
        name: params.id,
        date: new Date().getTime(),
        theme: params.id,
        chatRecord: chatRecord,
        imgs
      };

      console.log(historyData);

      await fetch('/api/eeg-story/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(historyData)
      })
        .then((res) => {
          return res.json();
        })
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.error(err);
        });
    };

    toast
      .promise(handleUploadPaintingHistory(), {
        loading: '上传中',
        success: '上传成功',
        error: '上传失败'
      })
      .then(() => {
        window.location.href = '/drawing';
      });
  };

  useEffect(() => {
    async function fetchData() {
      fetch(`/api/eeg-story/${params.id}`)
        .then((res) => res.json())
        .then((res) => {
          console.log(res);
          setCurrentStory(res);
        });
    }
    fetchData();

    const socket = new WebSocket('ws://localhost:3001');

    socket.onopen = () => {
      socket.send('hello');
    };

    socket.onmessage = (e) => {
      try {
        const data: Array<boolean | null | number> = JSON.parse(e.data).met;
        const result = translateDataByEEG(data);
        const targetStatusEeg = filterTargetDataByEEG(result);

        targetStatusEeg.status.length > 0 &&
          setCurrentEegStatus(targetStatusEeg.status);
      } catch {
        console.log(e.data);
      }
    };
  }, []);

  // 渲染聊天记录
  const renderChatRecordCard = (item: ChatRecordType) => {
    if (item.type === ChatTypeEnum.text) {
      return (
        <div
          key={item.id}
          className={`${style['drawing-chat-card']} ${
            item.role === 'user' ? 'user' : ''
          }`}
        >
          {item.content}
        </div>
      );
    } else if (item.type === ChatTypeEnum.img) {
      return (
        <div
          key={item.id}
          className={`${style['drawing-chat-card']} ${
            item.role === 'user' ? 'user' : ''
          } img`}
        >
          <img
            className={`${style['drawing-chat-content-img']}`}
            src={item.content}
            alt="chat-img"
          />
        </div>
      );
    }
  };

  return (
    <>
      <section
        className={'overflow-hidden !pb-0 !pt-0 flex w-[100vw] h-[100vh]'}
      >
        {/* 介绍阶段 */}
        <IntroductionStory
          currentStory={currentStory}
          isIntroductionStoryProcessing={isIntroductionStoryProcessing}
          handleIntroductionStoryProcessing={setIsIntroductionStoryProcessing}
        />

        {/* 开始画画 */}
        <section
          className={`${style['drawing-page-container']} ${
            isIntroductionStoryProcessing ? 'introduction' : ''
          } grow-0 shrink-0 w-[100vw] min-w-[100vw] max-w-[100vw]`}
        >
          {/* 左边 */}
          <section className={`${style['drawing-page-left-panel']}`}>
            <h3 className={`${style['drawing-page-title']}`}>
              {currentStory?.title ?? '暂无标题'}
            </h3>

            <section
              className={`${style['drawing-main-content']} main-ui-border`}
            >
              <h5
                className={`${style['drawing-content-tooltip']} main-ui-border`}
              >
                故事情节:{currentStory?.tips[tipsIndex] ?? '暂无提示'}
              </h5>
              <div
                className={`${style['drawing-content-background-container']}`}
              ></div>

              <div className={`${style['drawing-content-picture-container']}`}>
                {isCreatingPainting ? (
                  <Loading />
                ) : currentPainting.length > 0 ? (
                  <img
                    src={currentPainting}
                    alt=""
                    className={`${style['drawing-content-picture']}`}
                  />
                ) : null}
              </div>
            </section>

            <section className={`${style['drawing-content-footer']}`}>
              <div className={`${style['drawing-story-list-container']}`}>
                <div className="flex items-center">
                  <span className="mr-auto">故事旅程</span>
                  <div className="w-6 h-6 cursor-pointer bg-white flex items-center justify-center rounded-full mr-2">
                    <ArrowSmallLeftIcon className="w-5" />
                  </div>
                  <div className="w-6 h-6 cursor-pointer bg-white flex items-center justify-center rounded-full">
                    <ArrowSmallRightIcon className="w-5" />
                  </div>
                </div>
                <div
                  className={
                    'flex mt-1 h-24 overflow-hidden gap-3 overflow-x-scroll ' +
                    `${style['drawing-content-list']}`
                  }
                >
                  {paintingListMemo.map((item, index) => {
                    return <img src={item.content} alt="" key={index} />;
                  })}
                </div>
              </div>

              <div className="ml-4">
                <Button
                  category="green"
                  className="block mx-auto w-full mb-4"
                  onClick={() => {
                    setIsUploadDialogOpen(true);
                  }}
                  disabled={isChattingWithRobot}
                >
                  上传当前画面
                </Button>
                <Button
                  category="green"
                  className="block"
                  onClick={handleNextScene}
                  disabled={isChattingWithRobot}
                >
                  下一个情节
                </Button>
              </div>
            </section>
          </section>

          {/* 右边 */}
          <section className={`${style['drawing-page-right-panel']}`}>
            {/* 顶部 */}
            <section className={`${style['drawing-page-right-header']}`}>
              <div className="mr-auto">
                当前状态 {currentEegStatus || '不详'}
              </div>
              <Button
                category="red"
                onClick={() => {
                  setIsExitDrawingProcessingDialogOpen(true);
                }}
                disabled={isChattingWithRobot}
              >
                绘画结束
              </Button>
            </section>

            <div className={`${style['drawing-page-chat-page']} p-5 pb-2`}>
              <div className="flex flex-col h-full">
                <div className={`${style['drawing-chat-top']} mb-4`}>
                  <span className="mr-auto">交流记录</span>
                  <Switch
                    checked={isOnlyDisplayImg}
                    onChange={setIsOnlyDisplayImg}
                    className={`${
                      isOnlyDisplayImg ? 'bg-blue-400' : 'bg-[#cfcfcf]'
                    }
          relative inline-flex h-[26px] w-[52px] shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white/75`}
                  >
                    <span
                      aria-hidden="true"
                      className={`${
                        isOnlyDisplayImg
                          ? 'translate-x-[26px]'
                          : 'translate-x-0'
                      }
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                    />
                  </Switch>
                  <span className="ml-2 w-[108px]">
                    {isOnlyDisplayImg ? '只显示图片' : '显示全部记录'}
                  </span>
                </div>

                {/* 聊天框 */}
                <section className={`${style['drawing-chat-area-wrapper']}`}>
                  <section className={`${style['drawing-chat-area']}`}>
                    {filteredChatRecordList.map((item) => {
                      return renderChatRecordCard(item);
                    })}
                    {isChattingWithRobot ? (
                      <div className={`${style['drawing-chat-card']} loading`}>
                        {currentChatContent}
                      </div>
                    ) : null}

                    {/* <div
                      className={`${style['drawing-chat-card']} loading`}
                    ></div> */}
                  </section>
                </section>

                {/* 按钮 */}
                <section className="mt-auto flex flex-col items-end mb-3 border-t-2 border-t-blue-400">
                  <textarea
                    value={currentPaintingPrompt}
                    className="w-[55%] mb-4 h-24 p-2 rounded-lg resize-none"
                    onChange={handleChangeCurrentSketchPrompt}
                  />
                  <div>
                    {isChattingWithRobot ? (
                      <Button
                        category="blue"
                        className="w-16 mr-4"
                        onClick={handleBreakChatWithRobot}
                      >
                        中断对话
                      </Button>
                    ) : (
                      <Button
                        category="blue"
                        className="w-16 mr-4"
                        onClick={handleSubmitPromptToChat}
                      >
                        开始对话
                      </Button>
                    )}
                    <Button
                      category="blue"
                      className="w-16 "
                      onClick={handleSubmitPromptToPainting}
                      disabled={isChattingWithRobot}
                    >
                      开始绘制
                    </Button>
                  </div>
                </section>
              </div>

              {/* 吉祥物 */}
              <img
                src={chatRole}
                alt="chat-role"
                className={`${style['drawing-chatbot']}`}
              />
            </div>
          </section>
        </section>
      </section>
      <UploadPainting
        isOpen={isUploadDialogOpen}
        onClose={handleCloseUploadDialog}
        onConfirm={handleConfirmUploadDialog}
        handleUploadImage={handleUploadImageForPaintingList}
      />
      <Dialog
        isOpen={isExitDrawingProcessingDialogOpen}
        className="max-w-xl"
        footer={false}
        title={'绘画结束'}
        isMaskClickClosable={false}
      >
        <div>是否结束绘画，并保存绘画记录？</div>
        <div className="flex justify-between pt-4">
          <Button category="green" onClick={handleConfirmThisStory}>
            保存并退出
          </Button>
          <Button
            category="green"
            onClick={() => {
              setIsExitDrawingProcessingDialogOpen(false);
            }}
          >
            继续绘画
          </Button>
          <Button category="red">
            <Link to={'/drawing'}>不保存退出</Link>
          </Button>
        </div>
      </Dialog>
    </>
  );
}

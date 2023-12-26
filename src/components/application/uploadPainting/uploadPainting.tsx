import { useState, useRef, useEffect } from 'react';
import { Tab } from '@headlessui/react';

import Dialog from '@/components/base/dialog';
import Button from '@/components/base/button';

import style from './uploadPainting.module.css';
import React from 'react';
import uploadImageToBase64 from '@/utils/uploadImageToBas64';
import takePhotoHelper from '@/utils/takePhotoHelper';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  handleUploadImage: (value: string) => void;
}

enum UploadTypeEnum {
  Local = 0,
  Realtime = 1
}

export default function UploadPainting({
  isOpen,
  onClose,
  onConfirm,
  handleUploadImage: handleUploadImageForParent
}: Props) {
  const [previewResult, setPreviewResult] = useState<string>('');
  const [selectedUploadType, setSelectedUploadType] = useState<UploadTypeEnum>(
    UploadTypeEnum.Local
  );

  // 摄像头是否打开
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  // webRTC的使用
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamErrorRef = useRef<MediaError | null>(null);

  const handleCloseDialog = () => {
    handleCloseCamera();
    setPreviewResult('');
    onClose && onClose();
  };

  const handleChangeTabs = (index: number) => {
    setSelectedUploadType(index);

    if (isCameraOpen) {
      handleCloseCamera();
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    try {
      const previewResult = await uploadImageToBase64(file);

      setPreviewResult(previewResult);
    } catch (error) {
      toast.error('上传失败');
    }
  };

  const handleOpenCamera = async () => {
    const option = {
      audio: false,
      video: true
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(option);
      videoStreamRef.current = stream;

      const videoEle = videoElementRef.current;
      if (!videoEle) {
        return;
      }

      videoEle.srcObject = stream;
      setIsCameraOpen(true);
    } catch (error) {
      videoStreamErrorRef.current = error as MediaError;
    }
  };

  const handleCloseCamera = () => {
    const videoEle = videoElementRef.current;
    if (!videoEle) {
      return;
    }

    const stream = videoEle.srcObject as MediaStream;
    if ('getTracks' in stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });

      videoStreamErrorRef.current = null;
      setIsCameraOpen(false);
    }
  };

  const handleCameraByClick = () => {
    if (isCameraOpen) {
      handleCloseCamera();
    } else {
      toast.promise(handleOpenCamera(), {
        loading: '正在开启摄像头',
        success: '开启摄像头成功',
        error: '开启摄像头失败'
      });
    }
  };

  const handleTakePhoto = () => {
    if (!isCameraOpen) {
      toast.error('摄像头未打开');
      return;
    }

    const videoEle = videoElementRef.current;
    if (!videoEle) {
      return;
    }

    const data = takePhotoHelper(videoEle);
    setPreviewResult(data);
  };

  const handleUploadImageFromChild = () => {
    handleUploadImageForParent(previewResult);

    toast.success('上传成功');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onCancel={handleCloseDialog}
      onConfirm={onConfirm}
      title={
        <div className="flex items-center">
          <h2 className="font-black text-xl mb-6">上传当前画面</h2>
          <Button
            category="green"
            className="ml-auto mr-12"
            onClick={handleUploadImageFromChild}
          >
            上传
          </Button>
          <Button category="green" onClick={handleCloseDialog}>
            关闭
          </Button>
        </div>
      }
      footer={false}
      className="w-[100vw] max-w-[100vw] h-[96vh] bottom-0 fixed rounded-bl-[0] rounded-br-[0]"
    >
      <Tab.Group selectedIndex={selectedUploadType} onChange={handleChangeTabs}>
        <Tab.List className="flex space-x-2 rounded-xl bg-[#4abda2]/90 p-2 px-4">
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-[#4abda2] shadow'
                  : 'text-blue-100 hover:bg-white/[0.6] hover:text-white'
              )
            }
          >
            本地上传
          </Tab>
          <Tab
            className={({ selected }) =>
              clsx(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-[#4abda2] shadow'
                  : 'text-blue-100 hover:bg-white/[0.6] hover:text-white'
              )
            }
          >
            实时上传
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2 h-24">
          <Tab.Panel className={'h-24'}>
            <input
              accept="image/*"
              type="file"
              id="upload-image"
              className="hidden"
              onChange={handleUploadImage}
            />
            <label
              htmlFor="upload-image"
              className={
                'w-full h-full flex items-center justify-center ' +
                `${style['upload-local-label']}`
              }
            >
              点击上传图片
            </label>
          </Tab.Panel>
          <Tab.Panel className={'flex justify-center items-center h-20'}>
            <Button
              category="green"
              className="mr-8"
              onClick={handleCameraByClick}
            >
              {isCameraOpen ? '关闭摄像头' : '开启摄像头'}
            </Button>
            <Button category="green" onClick={handleTakePhoto}>
              拍照
            </Button>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <div className={`${style['preview-area']} mt-4`}>
        {selectedUploadType === UploadTypeEnum.Local ? (
          previewResult.length > 0 ? (
            <img src={previewResult} alt="preview-image" />
          ) : null
        ) : selectedUploadType === UploadTypeEnum.Realtime ? (
          <>
            <video ref={videoElementRef} muted autoPlay></video>
            {previewResult.length > 0 ? (
              <img
                src={previewResult}
                alt="preview-image"
                className={`${style['preview-area-image']}`}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </Dialog>
  );
}

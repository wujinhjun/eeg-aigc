import { Link } from 'react-router-dom';

import Button from '@/components/base/button';
import Dialog from '@/components/base/dialog';

type Props = {
  isOpen: boolean;
  handleCloseDialog: () => void;
  handleConfirmThisStory: () => void;
};

export default function FinalPaintingProcessing({
  isOpen,
  handleCloseDialog,
  handleConfirmThisStory
}: Props) {
  return (
    <Dialog
      isOpen={isOpen}
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
        <Button category="green" onClick={handleCloseDialog}>
          继续绘画
        </Button>
        <Button category="red">
          <Link to={'/drawing'}>不保存退出</Link>
        </Button>
      </div>
    </Dialog>
  );
}

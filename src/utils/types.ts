export enum ChatTypeEnum {
  text = 'text',
  img = 'img',
  loading = 'loading'
}

export enum ChatRoleEnum {
  robot = 'robot',
  user = 'user'
}

export type ChatRecordType = {
  id: string;
  type: ChatTypeEnum;
  role: ChatRoleEnum;
  content: string;
  time: string;
  eegStatus: string;
  imgType: '' | 'sketch' | 'painting';
};

export type StoryType = {
  title: string;
  description: string[];
  tips: string[];
};

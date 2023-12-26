const TOKEN = import.meta.env.VITE_GITHUB_SSH_KEY;
const OWNER = import.meta.env.VITE_GITHUB_USERNAME;
const REPO = import.meta.env.VITE_GITHUB_REPO;

function isValidHttpUrl(value: string) {
  let url;
  try {
    url = new URL(value);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function retryFunction<InputT extends unknown[], ReturnT>(
  fn: (...args: InputT) => Promise<ReturnT>,
  maxCount: number = 5
) {
  let count = 0;

  return async function (...args: InputT): Promise<ReturnT> {
    try {
      return await fn(...args);
    } catch (err) {
      if (count < maxCount) {
        count++;
        return retryFunction(fn, maxCount)(...args);
      }

      throw err;
    }
  };
}

/**
 * Description: 上传图片到github
 *
 * @param {string} fileName 文件名
 * @param {string} type 文件类型
 * @param {string} image base64格式的图片(带前缀)
 * @return {*}  {Promise<string>} 图片的下载地址
 */

function uploadImageToGithub(fileName: string, type: string, image: string) {
  if (isValidHttpUrl(image)) {
    return new Promise((resolve) => {
      resolve(image);
    });
  }
  const date = new Date();

  const path = `${date.getFullYear()}_${
    date.getMonth() + 1
  }_${date.getDate()}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}_${type}_${fileName}`;

  const headers = new Headers({
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json'
  });

  const body = {
    message: 'upload image',
    content: image.replace(/^data:image\/\w+;base64,/, ''),
    branch: 'main',
    path
  };

  return fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    }
  )
    .then((res) => {
      return res.json();
    })
    .then((res) => {
      const downloadUrl = res.content.download_url
        .replace('raw.githubusercontent.com', 'cdn.jsdelivr.net/gh')
        .replace('/main', '');
      return downloadUrl;
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
}

function uploadImageToGithubWithRetry(
  fileName: string,
  type: string,
  image: string
) {
  return retryFunction<string[], string>(uploadImageToGithub)(
    fileName,
    type,
    image
  );
}

const publicService = {
  uploadImageToGithub,
  uploadImageToGithubWithRetry
};

export default publicService;

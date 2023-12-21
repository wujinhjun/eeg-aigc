export default function uploadImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);

    fileReader.onload = async (event) => {
      if (!event.target) {
        return;
      }

      try {
        const result = event.target.result as string;
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
  });
}

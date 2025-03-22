import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImagePlus, Download, Trash2, Image as ImageIcon, Wand2, CheckCircle } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ImageFile extends File {
  preview?: string;
  width?: number;
  height?: number;
}

interface ResizedImage {
  originalName: string;
  resizedName: string;
  path: string;
}

interface ResizeResponse {
  status: string;
  message: string;
  results: ResizedImage[];
}

function App() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [resizedImages, setResizedImages] = useState<ResizedImage[]>([]);
  const [resizeWidth, setResizeWidth] = useState<number>(800);
  const [resizeHeight, setResizeHeight] = useState<number>(600);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => {
      const img = Object.assign(file, {
        preview: URL.createObjectURL(file)
      });
      return img;
    });
    setImages(prev => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxSize: 10485760 // 10MB
  });

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview || '');
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const resizeImages = async () => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      images.forEach(file => {
        formData.append("images[]", file);
      });
      formData.append("width", resizeWidth.toString());
      formData.append("height", resizeHeight.toString());

      const response = await fetch(`http://localhost/PROJECT/backend/index.php`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ResizeResponse = await response.json();

      if (data.status === "success") {
        setResizedImages(data.results);
        toast.success('Images resized successfully!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          className: 'bg-green-500 text-white rounded-xl shadow-lg',
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error resizing images:", error);
      toast.error('Failed to resize images!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSingle = async (image: ResizedImage) => {
    try {
      const imageUrl = `http://localhost/PROJECT/backend/${image.path}`;
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = image.resizedName || "resized-image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded successfully!', {
        position: 'top-right',
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed!', {
        position: 'top-right',
        autoClose: 2000,
      });
    }
  };

  const downloadAll = async () => {
    for (const image of resizedImages) {
      await downloadSingle(image); // Reuse single download logic
    }
  };

  useEffect(() => {
    return () => {
      images.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [images]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80')] opacity-5 bg-cover bg-center"></div>
      
      <div className="relative container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-float">
          <div className="inline-block p-2 px-6 mb-4 bg-indigo-100 rounded-full text-indigo-700 text-sm font-medium">
            Transform Your Images Instantly ✨
          </div>
          <h1 className="text-5xl font-bold text-indigo-900 mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Batch Image Resizer
          </h1>
          <p className="text-xl text-indigo-700 max-w-2xl mx-auto">
            Resize multiple images at once with our powerful, intuitive tool. Perfect for photographers, designers, and content creators.
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 mb-8 transition-all duration-300 hover:shadow-2xl animate-slide-up">
          <div
            {...getRootProps()}
            className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${isDragActive ? 'border-indigo-500 bg-indigo-50 scale-102 animate-pulse-border' : 'border-gray-300 hover:border-indigo-400'}`}
          >
            <input {...getInputProps()} />
            <ImagePlus className={`mx-auto h-16 w-16 ${isDragActive ? 'text-indigo-600' : 'text-indigo-400'} mb-4 transition-colors duration-300`} />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">{isDragActive ? 'Drop your images here!' : 'Drag & Drop Images'}</h3>
            <p className="text-lg text-gray-600">or click to select files from your computer</p>
            <p className="text-sm text-gray-500 mt-2">Supports: PNG, JPG, JPEG, GIF (Max size: 10MB)</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center mb-6">
            <Wand2 className="w-8 h-8 text-indigo-500 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-800">Resize Settings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Width (px)</label>
              <input
                type="number"
                value={resizeWidth}
                onChange={(e) => setResizeWidth(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter width..."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Height (px)</label>
              <input
                type="number"
                value={resizeHeight}
                onChange={(e) => setResizeHeight(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter height..."
              />
            </div>
          </div>
        </div>

        {images.length > 0 && (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl p-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center">
                <ImageIcon className="w-8 h-8 text-indigo-500 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-800">Selected Images ({images.length})</h2>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={resizeImages}
                  disabled={isProcessing}
                  className={`flex items-center px-8 py-4 rounded-xl text-white font-medium transition-all duration-300 transform hover:scale-105 ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-lg'}`}
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Resizing...
                    </div>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5 mr-2" />
                      Resize Images
                    </>
                  )}
                </button>
                {resizedImages.length > 0 && (
                  <button
                    onClick={downloadAll}
                    disabled={isProcessing}
                    className={`flex items-center px-8 py-4 rounded-xl text-white font-medium transition-all duration-300 transform hover:scale-105 ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg'}`}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download All
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((file, index) => (
                <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg transform hover:scale-102">
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                    onLoad={() => {
                      URL.revokeObjectURL(file.preview || '');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                    <p className="text-white font-medium truncate max-w-[70%]">{file.name}</p>
                    <div className="flex space-x-2">
                      {resizedImages[index] && (
                        <button
                          onClick={() => downloadSingle(resizedImages[index])}
                          className="p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors transform hover:scale-110"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => removeImage(index)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors transform hover:scale-110"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ToastContainer />
      </div>
    </div>
  );
}

export default App;
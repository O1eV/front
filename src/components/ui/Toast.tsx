import './Toast.css';

interface ToastProps {
    toastMessage: string;
    setToastMessage: (message: string) => void;
}

export function Toast({ toastMessage, setToastMessage }: ToastProps) {
    return (
        <div role="status" className="toast">
            {toastMessage}
            <button aria-label="닫기" onClick={() => setToastMessage('')}>
                ×
            </button>
        </div>
    );
}

import { format } from "date-fns";

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderImage?: string;
    createdAt: string;
  };
  isOwn: boolean;
  'data-testid'?: string;
}

export default function MessageBubble({ message, isOwn, 'data-testid': testId }: MessageBubbleProps) {
  if (isOwn) {
    return (
      <div className="flex items-start space-x-3 justify-end" data-testid={testId}>
        <div className="flex-1 flex flex-col items-end">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs text-muted-foreground" data-testid="text-message-time">
              {format(new Date(message.createdAt), 'h:mm a')}
            </span>
            <span className="font-medium text-foreground text-sm">You</span>
          </div>
          <div className="bg-primary text-primary-foreground p-3 rounded-[18px_18px_4px_18px] max-w-md">
            <p data-testid="text-message-content">{message.content}</p>
          </div>
        </div>
        <img
          src={message.senderImage || `https://ui-avatars.com/api/?name=${message.senderName}&size=32`}
          alt="You"
          className="w-8 h-8 rounded-full flex-shrink-0"
          data-testid="img-message-sender"
        />
      </div>
    );
  }

  return (
    <div className="flex items-start space-x-3" data-testid={testId}>
      <img
        src={message.senderImage || `https://ui-avatars.com/api/?name=${message.senderName}&size=32`}
        alt={message.senderName}
        className="w-8 h-8 rounded-full flex-shrink-0"
        data-testid="img-message-sender"
      />
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-foreground text-sm" data-testid="text-sender-name">
            {message.senderName}
          </span>
          <span className="text-xs text-muted-foreground" data-testid="text-message-time">
            {format(new Date(message.createdAt), 'h:mm a')}
          </span>
        </div>
        <div className="bg-muted text-foreground p-3 rounded-[18px_18px_18px_4px] max-w-md">
          <p data-testid="text-message-content">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

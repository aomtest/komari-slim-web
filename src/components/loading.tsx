type LoadingProps = {
    text?: string;
    children?: React.ReactNode;
};

const Loading = ({ text, children }: LoadingProps) => {
  return (
    <div className="flex items-center justify-center flex-col">
        <img src="/assets/BlueArchive-loading.gif" className="h-16 mb-4" />
        <p className="text-lg font-bold">Loading...</p>
        <p className="text-sm text-muted-foreground mb-4">
            {text}
        </p>
        <div>
            {children}
        </div>
    </div>
  );
};

export default Loading;

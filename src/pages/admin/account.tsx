
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Github, Lock, Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface UserInfo {
  username: string;
  uuid: string;
  sso_id: string;
}

const Account = () => {
    const { t } = useTranslation();
    const [userInfo, setUserInfo] = React.useState<UserInfo | null>(null);
    const [username, setUsername] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);

    // 获取用户信息
    const fetchUserInfo = async () => {
        try {
            const response = await fetch('/api/me');
            const data = await response.json();
            setUserInfo(data);
            setUsername(data.username);
        } catch (error) {
            console.error('获取用户信息失败:', error);
            toast.error(t('account_settings.get_user_info_failed'));
        }
    };

    React.useEffect(() => {
        fetchUserInfo();
    }, []);

    // 更新用户名
    const handleUpdateUsername = async () => {
        if (!username.trim()) {
            toast.error(t('account_settings.username_empty'));
            return;
        }

        if (username === userInfo?.username) {
            toast.info(t('account_settings.username_unchanged'));
            return;
        }

        setIsLoading(true);
        try {
            // 调用更新用户名的API
            const response = await fetch('/api/me/update-username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username })
            });

            if (response.ok) {
                toast.success(t('account_settings.username_update_success'));
                fetchUserInfo(); // 刷新用户信息
            } else {
                const error = await response.json();
                toast.error(`${t('account_settings.username_update_failed')}: ${error.message || t('未知错误')}`);
            }
        } catch (error) {
            console.error('更新用户名失败:', error);
            toast.error(t('account_settings.username_update_failed'));
        } finally {
            setIsLoading(false);
        }
    };

    // 检查是否绑定GitHub
    const isGithubBound = React.useMemo(() => {
        return userInfo?.sso_id?.startsWith('github_') || false;
    }, [userInfo?.sso_id]);

    // 处理GitHub绑定/解绑
    const handleGithubAuth = async () => {
        setIsLoading(true);
        try {
            if (isGithubBound) {
                // 解绑GitHub
                const response = await fetch('/api/admin/oauth2/unbind', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    toast.success(t('account_settings.unbind_github_success'));
                    fetchUserInfo(); // 刷新用户信息
                } else {
                    const error = await response.json();
                    toast.error(`${t('account_settings.unbind_github_failed')}: ${error.message || t('未知错误')}`);
                }
            } else {
                // 绑定GitHub，通常需要重定向到GitHub授权页面
                window.location.href = '/api/admin/oauth2/bind';
            }
        } catch (error) {
            console.error('处理GitHub认证失败:', error);
            toast.error(t('account_settings.github_auth_failed'));
        } finally {
            setIsLoading(false);
        }
    };

    if (!userInfo) {
        return <div className="flex justify-center items-center h-[80vh]">Loading...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-8">{t('account_settings.title')}</h1>
            
            {/* 用户ID信息 */}
            <div className="mb-8 p-4 bg-[var(--accent-2)] rounded-lg">
                <p className="text-sm text-[var(--accent-11)]">
                    <span className="font-medium">UUID:</span> {userInfo.uuid}
                </p>
            </div>

            {/* 用户名设置 */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <User className="size-5" />
                    {t('account_settings.username_settings')}
                </h2>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="username">{t('account_settings.username')}</Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={t('account_settings.enter_new_username')}
                        />
                    </div>
                    <Button 
                        onClick={handleUpdateUsername} 
                        disabled={isLoading || username === userInfo.username}
                    >
                        <Save className="size-4" />
                        {t('account_settings.save_username')}
                    </Button>
                </div>
            </div>

            {/* 密码设置 */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Lock className="size-5" />
                    {t('account_settings.password_settings')}
                </h2>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 flex gap-3 text-yellow-800 dark:text-yellow-200 mb-4">
                    <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">{t('account_settings.password_cli_only')}</p>
                        <p className="text-sm mt-1 text-yellow-700 dark:text-yellow-300">{t('account_settings.password_cli_instructions')}</p>
                        <pre className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/50 rounded text-xs overflow-x-auto">
                            ./komari chpasswd -u USERNAME -p NEW_PASSWORD
                        </pre>
                    </div>
                </div>
            </div>

            {/* GitHub账户绑定/解绑 */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Github className="size-5" />
                    {t('account_settings.github_account')}
                </h2>
                <div className="p-4 bg-[var(--accent-2)] rounded-lg mb-4">
                    <p>
                        {isGithubBound ? (
                            <span className="flex items-center gap-2">
                                <span className="inline-block p-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md text-xs">已绑定</span>
                                GitHub ID: {userInfo.sso_id.replace('github_', '')}
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <span className="inline-block p-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md text-xs">未绑定</span>
                                {t('account_settings.github_not_bound')}
                            </span>
                        )}
                    </p>
                </div>

                {isGithubBound ? (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="destructive">
                                {t('account_settings.unbind_github')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('account_settings.confirm_unbind')}</DialogTitle>
                                <DialogDescription>
                                    {t('account_settings.unbind_github_warning')}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogTrigger asChild>
                                    <Button variant="outline">{t('account_settings.cancel')}</Button>
                                </DialogTrigger>
                                <Button variant="destructive" onClick={handleGithubAuth} disabled={isLoading}>
                                    {t('account_settings.confirm_unbind')}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                ) : (
                    <Button onClick={handleGithubAuth} disabled={isLoading}>
                        <Github className="size-4" />
                        绑定GitHub账户
                    </Button>
                )}
            </div>
        </div>
    );
};

export default Account;

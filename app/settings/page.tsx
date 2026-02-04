'use client';

import { useState } from 'react';
import { Bell, Clock, Mail, Smartphone } from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    beforeSubscription: true,
    beforeListing: true,
    newsUpdate: false,
    emailNotification: false,
    pushNotification: true,
  });

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-sm text-gray-500">알림 및 설정을 관리하세요</p>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-[#3182F6]" />
            <h2 className="text-lg font-bold text-gray-900">알림 설정</h2>
          </div>

          <div className="space-y-4">
            {/* 청약 시작 알림 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">청약 시작 1시간 전 알림</h3>
                  <p className="text-sm text-gray-500">청약이 시작되기 1시간 전에 알림을 받습니다</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('beforeSubscription')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.beforeSubscription ? 'bg-[#3182F6]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.beforeSubscription ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 상장 예정 알림 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">상장 예정 알림</h3>
                  <p className="text-sm text-gray-500">상장 예정일 하루 전에 알림을 받습니다</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('beforeListing')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.beforeListing ? 'bg-[#3182F6]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.beforeListing ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 뉴스 업데이트 알림 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">뉴스 업데이트 알림</h3>
                  <p className="text-sm text-gray-500">새로운 공모주 뉴스가 업데이트되면 알림을 받습니다</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('newsUpdate')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.newsUpdate ? 'bg-[#3182F6]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.newsUpdate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notification Methods */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">알림 수신 방법</h2>
          
          <div className="space-y-4">
            {/* Email Notification */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900">이메일 알림</h3>
                  <p className="text-sm text-gray-500">이메일로 알림을 받습니다</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('emailNotification')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.emailNotification ? 'bg-[#3182F6]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.emailNotification ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Push Notification */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-400" />
                <div>
                  <h3 className="font-medium text-gray-900">푸시 알림</h3>
                  <p className="text-sm text-gray-500">브라우저 푸시 알림을 받습니다</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('pushNotification')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications.pushNotification ? 'bg-[#3182F6]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.pushNotification ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


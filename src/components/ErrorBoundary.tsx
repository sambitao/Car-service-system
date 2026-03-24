import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      let parsedError: any = null;
      try {
        if (this.state.error?.message) {
          parsedError = JSON.parse(this.state.error.message);
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full border border-red-100">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6 mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-4">
              เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล
            </h1>
            
            {parsedError && parsedError.error && parsedError.error.includes('permission-denied') ? (
              <div className="bg-orange-50 rounded-2xl p-6 mb-6 border border-orange-100">
                <h2 className="text-lg font-bold text-orange-800 mb-2">ปัญหาเรื่องสิทธิ์การเข้าถึง (Permission Denied)</h2>
                <p className="text-orange-700 mb-4">
                  ระบบไม่สามารถอ่านหรือเขียนข้อมูลใน Firebase ได้ เนื่องจาก Security Rules ของ Firestore ปฏิเสธการเข้าถึง
                </p>
                <div className="bg-white rounded-xl p-4 border border-orange-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">วิธีแก้ไขเบื้องต้น (สำหรับการทดสอบ):</p>
                  <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2">
                    <li>ไปที่ <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Firebase Console</a></li>
                    <li>เลือกโปรเจกต์ <strong>maintainance-store</strong></li>
                    <li>ไปที่เมนู <strong>Firestore Database</strong> &gt; <strong>Rules</strong></li>
                    <li>เปลี่ยนกฎเป็น: <code className="bg-slate-100 px-2 py-1 rounded text-xs text-pink-600">allow read, write: if true;</code></li>
                    <li>กด <strong>Publish</strong> แล้วรีเฟรชหน้านี้</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 rounded-2xl p-6 mb-6 border border-red-100 overflow-auto">
                <p className="text-red-800 font-mono text-sm whitespace-pre-wrap">
                  {this.state.error?.toString()}
                </p>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                โหลดหน้าเว็บใหม่
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

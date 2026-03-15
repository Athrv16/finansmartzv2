"use client";


import { scanReceipt } from '@/actions/transaction';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/use-fetch';
import { Camera, Loader2 } from 'lucide-react';
import React, { useEffect, useRef } from 'react'
import { toast } from 'sonner';

const ReceiptScanner = ({onScanComplete}) => {
    const fileInputRef = useRef();

    const {
        loading: scanReceiptLoading,
        fn: scanReceiptFn,
        data: scannedData,
    } = useFetch(scanReceipt);


    const handleReceiptScan = async(file) => {
        if(file.size > 5 * 1024 * 1024) {
            toast.error("File size should be less than 5MB");
            return;
        }
        await scanReceiptFn(file);
     };

     useEffect(()=>{
        if (scannedData && !scanReceiptLoading) {
            onScanComplete(scannedData);
            toast.success("Receipt scanned Successfully");
        }
     }, [scanReceiptLoading, scannedData]
    );


    return (
        <div><input
            type="file" ref={fileInputRef}
            className='hidden'
            accept="image/*"
            capture="environment"
            onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleReceiptScan(file);
            }}
        />

            <Button 
            type= "button"
            variant= "outline"
            className="w-full h-11 rounded-xl border border-blue-200/70 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white shadow-sm transition hover:opacity-95 hover:text-white dark:border-blue-500/30"
            onClick={()=> fileInputRef.current?.click()}
            disabled = {scanReceiptLoading}>
                {scanReceiptLoading ? (
                    <>
                        <Loader2 className="mr-2 animate-spin" />
                        <span>Scanning Receipt...</span>
                    </>
                ) : (
                    <>
                        {" "}
                        <Camera className="mr-2" />
                        <span>Scan Receipt with AI</span>
                    </>
                )}
            </Button>

        </div>
    );
};

export default ReceiptScanner;

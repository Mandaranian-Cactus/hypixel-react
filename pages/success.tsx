import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { toast } from 'react-toastify'
import { getHeadElement } from '../utils/SSRUtils'

function Success() {
    let router = useRouter()

    useEffect(() => {
        toast.success('Payment successful')
        router.push('/premium')
    }, [])

    return <div className="page">{getHeadElement('Payment successful')}</div>
}

export default Success

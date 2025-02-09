import React, { useState } from 'react'
import { Container } from 'react-bootstrap'
import api, { initAPI } from '../api/ApiHelper'
import GoogleSignIn from '../components/GoogleSignIn/GoogleSignIn'
import LowSupplyList from '../components/LowSupplyList/LowSupplyList'
import NavBar from '../components/NavBar/NavBar'
import { useWasAlreadyLoggedIn } from '../utils/Hooks'
import { getLoadingElement } from '../utils/LoadingUtils'
import { parseLowSupplyItem } from '../utils/Parser/APIResponseParser'
import { getHeadElement } from '../utils/SSRUtils'

interface Props {
    lowSupplyItems: any
}

function LowSupply(props: Props) {
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [hasPremium, setHasPremium] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    function onLogin() {
        let googleId = localStorage.getItem('googleId')
        if (googleId) {
            setIsLoggedIn(true)
            loadHasPremium()
        }
    }

    function onLoginFail() {
        setIsLoggedIn(false)
    }

    let loadHasPremium = () => {
        let googleId = localStorage.getItem('googleId')
        api.hasPremium(googleId!).then(hasPremiumUntil => {
            if (hasPremiumUntil > new Date()) {
                setHasPremium(true)
            }
        })
    }

    return (
        <div className="page">
            {getHeadElement('Low Supply Items', 'Items that are in low supply on the auction house')}
            <Container>
                <h2>
                    <NavBar />
                    Low supply items
                </h2>
                <hr />
                {isLoggedIn && hasPremium ? (
                    <div>
                        <p>These are low supply items. Strong price fluctuation may occur.</p>
                        <LowSupplyList lowSupplyItems={props.lowSupplyItems?.map(parseLowSupplyItem)} />
                    </div>
                ) : null}
                {wasAlreadyLoggedIn && !isLoggedIn ? getLoadingElement() : ''}
                {!wasAlreadyLoggedIn && !isLoggedIn ? <p>You need to be logged in and have premium to see this page.</p> : ''}
                {isLoggedIn && !hasPremium ? <p>You need to have premium to see this page.</p> : ''}
                <GoogleSignIn onAfterLogin={onLogin} onLoginFail={onLoginFail} />
            </Container>
        </div>
    )
}

export const getStaticProps = async () => {
    let api = initAPI(true)
    let lowSupplyItems = await api.getLowSupplyItems()
    return {
        props: {
            lowSupplyItems: lowSupplyItems
        },
        revalidate: 60
    }
}

export default LowSupply

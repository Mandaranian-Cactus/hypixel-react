import React, { useEffect, useRef, useState } from 'react'
import { Badge, Button, ListGroup } from 'react-bootstrap'
import InfiniteScroll from 'react-infinite-scroll-component'
import api from '../../api/ApiHelper'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { convertTagToName, numberWithThousandsSeperators } from '../../utils/Formatter'
import { useForceUpdate } from '../../utils/Hooks'
import SubscribeButton from '../SubscribeButton/SubscribeButton'
import { ArrowUpward as ArrowUpIcon } from '@mui/icons-material'
import { CopyButton } from '../CopyButton/CopyButton'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './PlayerDetailsList.module.css'

interface Props {
    playerUUID: string
    playerName: string
    loadingDataFunction: Function
    type: 'auctions' | 'bids'
}

interface ListState {
    listElements: (Auction | BidForList)[]
    allElementsLoaded: boolean
    yOffset: number
    playerUUID: string
    type: 'auctions' | 'bids'
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true

// States, to remember the positions in the list, after coming back
let listStates: ListState[] = []

function PlayerDetailsList(props: Props) {
    let forceUpdate = useForceUpdate()
    let router = useRouter()

    let [listElements, setListElements] = useState<(Auction | BidForList)[]>([])
    let [allElementsLoaded, setAllElementsLoaded] = useState<boolean>()
    let [playerName, setPlayerName] = useState<string>('')
    let isLoadingElements = useRef(false)

    useEffect(() => {

        mounted = true
        router.events.on('routeChangeStart', onRouteChange)

        setPlayerName(props.playerName)

        let listState = getListState()
        if (listState) {
            setListElements(listState.listElements)
            setAllElementsLoaded(listState.allElementsLoaded)
            isLoadingElements.current = false
        }
        else {
            // We need to set reset to true to remove the previous player's listElements
            loadNewElements(true)
        }

        setTimeout(() => {
            if (!mounted) {
                return
            }
            window.scrollTo({
                left: 0,
                top: listState!.yOffset,
                behavior: 'auto'
            })
        }, 100)

        return () => {
            mounted = false
            router.events.off('routeChangeStart', onRouteChange)
        }

    }, [props.playerUUID])


    let onRouteChange = () => {
        console.log("list States", listStates)
        let listState = getListState()
        if (listState) {
            listState.yOffset = window.pageYOffset
        }
    }

    let loadNewElements = (reset?: boolean): void => {
        if (isLoadingElements.current) {
            return
        }
        isLoadingElements.current = true
        props
            .loadingDataFunction(props.playerUUID, 12, reset ? 0 : listElements.length)
            .then(newListElements => {
                isLoadingElements.current = false
                if (!mounted) {
                    return
                }

                if (newListElements.length === 0) {
                    allElementsLoaded = true
                    setAllElementsLoaded(true)
                }

                listElements = reset ? newListElements : listElements.concat(newListElements)

                newListElements.forEach(auction => {
                    auction.item.iconUrl = api.getItemImageUrl(auction.item)
                })
                setListElements(listElements)
                updateListState()

                if (listElements.length < 12 && newListElements.length !== 0) {
                    loadNewElements()
                }
            })
            .catch(() => {
                setAllElementsLoaded(true)
            })
    }

    let getCoinImage = () => {
        return <img src="/Coin.png" height="35px" width="35px" alt="auction house logo" loading="lazy" />
    }

    let getItemImageElement = (listElement: Auction | BidForList) => {
        return listElement.item.iconUrl ? (
            <img
                crossOrigin="anonymous"
                className="auctionItemImage"
                src={listElement.item.iconUrl}
                style={{ marginRight: '10px' }}
                alt="item icon"
                height="48"
                onError={error => onImageLoadError(listElement, error)}
                loading="lazy"
            />
        ) : undefined
    }

    let onImageLoadError = (listElement: Auction | BidForList, data: any) => {
        api.getItemDetails(listElement.item.tag).then(item => {
            listElement.item.iconUrl = item.iconUrl
            setListElements(listElements)
            forceUpdate()
        })
    }

    let updateListState = () => {
        let listState = getListState()
        if (listState) {
            listState.allElementsLoaded = allElementsLoaded
            listState.listElements = listElements
        } else {
            listStates.push({
                type: props.type,
                listElements: listElements,
                playerUUID: props.playerUUID,
                yOffset: window.pageYOffset,
                allElementsLoaded: allElementsLoaded
            })
        }
    }

    let getListState = (): ListState | undefined => {
        return listStates.find(state => {
            return state.playerUUID === props.playerUUID && state.type === props.type
        })
    }

    let bottomElements = (
        <div className={styles.fixedBottom}>
            {props.type === 'auctions' ? (
                <>
                    <div className={styles.btnBottom}>
                        <SubscribeButton type="player" topic={props.playerUUID} />
                    </div>
                    <CopyButton
                        buttonVariant="primary"
                        buttonWrapperClass={styles.btnBottom}
                        copyValue={'/ah ' + playerName}
                        successMessage={
                            <p>
                                Copied ingame link <br /> <i>/ah {playerName}</i>
                            </p>
                        }
                    />
                    <div className={styles.btnBottom}>
                        <Button
                            aria-label="up button"
                            type="primary"
                            className={styles.upButton}
                            onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                        >
                            <ArrowUpIcon />
                        </Button>
                    </div>
                </>
            ) : (
                ''
            )}
            {props.type === 'bids' ? (
                <>
                    <div className={styles.btnBottom}>
                        <SubscribeButton type="player" topic={props.playerUUID} />
                    </div>
                    <Button
                        type="primary"
                        className={styles.btnBottom}
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                    >
                        <ArrowUpIcon />
                    </Button>
                </>
            ) : (
                ''
            )}
        </div>
    )

    let list = listElements.map((listElement, i) => {
        return (
            <ListGroup.Item action className={styles.listGroupItem} key={'listItem-' + i}>
                <span key={listElement.uuid} className={`${styles.disableLinkStyle} ${styles.listItemLink}`}>
                    <Link href={`/auction/${listElement.uuid}`}>
                        <a className="disableLinkStyle">
                            <div>
                                <h4>
                                    {getItemImageElement(listElement)}
                                    {listElement.item.name || convertTagToName(listElement.item.tag)}
                                    {listElement.end.getTime() < Date.now() || (listElement.bin && listElement.highestBid > 0) ? (
                                        <Badge variant="danger" style={{ marginLeft: '10px' }}>
                                            Ended
                                        </Badge>
                                    ) : (
                                        <Badge variant="info" style={{ marginLeft: '10px' }}>
                                            Running
                                        </Badge>
                                    )}
                                    {listElement.bin ? (
                                        <Badge style={{ marginLeft: '5px' }} variant="success">
                                            BIN
                                        </Badge>
                                    ) : (
                                        ''
                                    )}
                                </h4>
                                <p>
                                    Highest Bid: {numberWithThousandsSeperators(listElement.highestBid)} {getCoinImage()}
                                </p>
                                {props.type === 'auctions' ? (
                                    <p>
                                        Starting Bid: {numberWithThousandsSeperators((listElement as Auction).startingBid)} {getCoinImage()}
                                    </p>
                                ) : (
                                    <p>
                                        Highest Own: {numberWithThousandsSeperators((listElement as BidForList).highestOwn)} {getCoinImage()}
                                    </p>
                                )}
                                <p>End of Auction: {listElement.end.toLocaleTimeString() + ' ' + listElement.end.toLocaleDateString()}</p>
                            </div>
                        </a>
                    </Link>
                </span>
            </ListGroup.Item>
        )
    })

    return (
        <div className={styles.playerDetailsList}>
            {listElements.length === 0 && allElementsLoaded ? (
                <div className="noAuctionFound">
                    <img src="/Barrier.png" height="24" alt="not found icon" style={{ float: 'left', marginRight: '5px' }} />
                    <p>No auctions found</p>
                </div>
            ) : (
                <InfiniteScroll
                    style={{ overflow: 'hidden' }}
                    dataLength={listElements.length}
                    next={() => {
                        loadNewElements()
                    }}
                    hasMore={!allElementsLoaded}
                    loader={
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div>
                                <div>{getLoadingElement()}</div>
                                <Button
                                    onClick={() => {
                                        loadNewElements()
                                    }}
                                >
                                    Click here to manually load new data...
                                </Button>
                            </div>
                        </div>
                    }
                >
                    <ListGroup className={styles.list}>{list}</ListGroup>
                </InfiniteScroll>
            )}
            {bottomElements}
        </div>
    )
}

export default PlayerDetailsList
